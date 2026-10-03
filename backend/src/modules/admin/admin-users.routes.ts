import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { RoleName } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { audit, notify } from '../../shared/audit.js';
import { badRequest, conflict, notFound } from '../../shared/errors.js';
import { created, ok, type RouteDef } from '../../shared/http.js';
import { parse } from '../../shared/validation.js';
import { uniqueSlug } from '../../utils/slug.js';
import { passwordSchema } from '../auth/auth.routes.js';
import { TERMINAL_STATUSES } from '../custom-art/state-machine.js';

const ADMIN: RoleName[] = ['ADMIN'];
const BCRYPT_ROUNDS = 12;

const createUserSchema = z
  .object({
    role: z.enum(['CUSTOMER', 'ARTIST', 'ADMIN']),
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(190),
    phone: z.string().trim().max(20).optional(),
    password: passwordSchema,
    // Artist-only fields
    displayName: z.string().trim().min(2).max(120).optional(),
    artistType: z.enum(['INDIVIDUAL', 'STUDIO', 'GALLERY', 'CREATIVE_BUSINESS']).default('INDIVIDUAL'),
    bio: z.string().trim().max(500).optional(),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
    country: z.string().trim().max(60).default('IN'),
    acceptsCustomArt: z.boolean().default(true),
    /** Admin-created artists are approved straight away unless the admin chooses review. */
    approveNow: z.boolean().default(true),
  })
  .refine((v) => v.role !== 'ARTIST' || !!v.displayName, { path: ['displayName'], message: 'Artist / gallery name is required' });

async function roleIds(names: RoleName[]) {
  const ids: string[] = [];
  for (const name of names) ids.push((await prisma.role.upsert({ where: { name }, update: {}, create: { name } })).id);
  return ids;
}

export const adminUserRoutes: RouteDef[] = [
  {
    method: 'POST',
    path: '/admin/users',
    roles: ADMIN,
    rateLimit: 'strict',
    handler: async (ctx) => {
      const input = parse(createUserSchema, ctx.body);
      if (await prisma.user.findUnique({ where: { email: input.email } })) throw conflict('An account with this email already exists');

      // Artists can also buy art, so they get the customer role too (same as self-registration).
      const roles: RoleName[] = input.role === 'ARTIST' ? ['ARTIST', 'CUSTOMER'] : [input.role];
      const artistStatus = input.approveNow ? 'APPROVED' : 'PENDING_APPROVAL';
      const user = await prisma.user.create({
        data: {
          email: input.email,
          fullName: input.fullName,
          phone: input.phone,
          passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
          roles: { create: (await roleIds(roles)).map((roleId) => ({ roleId })) },
          customerProfile: { create: {} },
          wishlists: { create: { name: 'My Wishlist' } },
          ...(input.role === 'ARTIST'
            ? {
                artist: {
                  create: {
                    displayName: input.displayName!,
                    slug: uniqueSlug(input.displayName!),
                    type: input.artistType,
                    status: artistStatus,
                    acceptsCustomArt: input.acceptsCustomArt,
                    profile: { create: { bio: input.bio } },
                    address: { create: { city: input.city, state: input.state, country: input.country } },
                    approvals: { create: { adminId: ctx.user!.id, toStatus: artistStatus, reason: 'Account created by admin' } },
                    gallery: { create: { name: input.displayName!, slug: uniqueSlug(input.displayName!), tagline: input.bio } },
                  },
                },
              }
            : {}),
        },
        select: { id: true, email: true, fullName: true, status: true, createdAt: true, artist: { select: { id: true, slug: true, status: true } } },
      });
      await audit(ctx.user, 'USER_CREATED_BY_ADMIN', 'User', user.id, { role: input.role, email: input.email, artistStatus: user.artist?.status ?? null }, { ip: ctx.ip });
      return created({ ...user, roles });
    },
  },
  {
    method: 'DELETE',
    path: '/admin/users/:id',
    roles: ADMIN,
    rateLimit: 'strict',
    handler: async (ctx) => {
      const { reason } = parse(z.object({ reason: z.string().trim().min(3, 'Give a reason (min 3 characters)').max(500) }), ctx.body);
      const id = ctx.params.id;
      if (id === ctx.user!.id) throw badRequest('You cannot delete your own account');
      const user = await prisma.user.findUnique({ where: { id }, include: { roles: { include: { role: true } }, artist: true } });
      if (!user || user.status === 'DELETED') throw notFound('User');
      const isAdminAccount = user.roles.some((r) => r.role.name === 'ADMIN');
      if (isAdminAccount) {
        const otherAdmins = await prisma.user.count({ where: { id: { not: id }, status: 'ACTIVE', roles: { some: { role: { name: 'ADMIN' } } } } });
        if (otherAdmins === 0) throw badRequest('You cannot delete the last active admin');
      }

      // Open custom-art requests involving this account are cancelled so nobody waits on a deleted person.
      const openRequests = await prisma.customArtRequest.findMany({
        where: { status: { notIn: TERMINAL_STATUSES }, OR: [{ customerId: id }, ...(user.artist ? [{ artistId: user.artist.id }] : [])] },
        select: { id: true, status: true, requestNumber: true, customerId: true, artist: { select: { userId: true } } },
      });

      await prisma.$transaction(async (tx) => {
        // Soft delete + anonymise. Orders, payments, commissions and ledger rows are kept intact
        // (financial records), but no personal data remains on the account.
        await tx.user.update({
          where: { id },
          data: {
            status: 'DELETED',
            email: `deleted+${id}@deleted.invalid`,
            fullName: 'Deleted user',
            phone: null,
            avatarUrl: null,
            passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 4),
            failedLogins: 0,
            lockedUntil: null,
          },
        });
        await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
        await tx.customerAddress.deleteMany({ where: { userId: id } });
        await tx.cart.deleteMany({ where: { userId: id } });
        await tx.recentlyViewedArtwork.deleteMany({ where: { userId: id } });
        await tx.customerProfile.updateMany({ where: { userId: id }, data: { dateOfBirth: null, preferences: undefined } });

        // Keep follower counts accurate for artists this user followed.
        const follows = await tx.artistFollow.findMany({ where: { userId: id }, select: { artistId: true } });
        for (const f of follows) await tx.artist.update({ where: { id: f.artistId }, data: { followerCount: { decrement: 1 } } });
        await tx.artistFollow.deleteMany({ where: { userId: id } });

        if (user.artist) {
          // Take the artist offline: profile hidden (INACTIVE) and every live artwork archived.
          await tx.artist.update({ where: { id: user.artist.id }, data: { status: 'INACTIVE', isFeatured: false, avatarUrl: null, acceptsCustomArt: false } });
          await tx.artistApproval.create({ data: { artistId: user.artist.id, adminId: ctx.user!.id, fromStatus: user.artist.status, toStatus: 'INACTIVE', reason: `Account deleted: ${reason}` } });
          const live = await tx.artwork.findMany({ where: { artistId: user.artist.id, status: { not: 'ARCHIVED' } }, select: { id: true, status: true } });
          for (const w of live) {
            await tx.artwork.update({ where: { id: w.id }, data: { status: 'ARCHIVED', isFeatured: false } });
            await tx.artworkApproval.create({ data: { artworkId: w.id, actorId: ctx.user!.id, fromStatus: w.status, toStatus: 'ARCHIVED', reason: 'Artist account deleted' } });
          }
          await tx.featuredArtist.deleteMany({ where: { artistId: user.artist.id } });
        }

        for (const r of openRequests) {
          await tx.customArtRequest.update({ where: { id: r.id }, data: { status: 'CANCELLED' } });
          await tx.customArtStatusHistory.create({
            data: { requestId: r.id, fromStatus: r.status, toStatus: 'CANCELLED', actorId: ctx.user!.id, actorRole: 'ADMIN', note: 'Cancelled because an account involved was deleted' },
          });
          const otherParty = r.customerId === id ? r.artist.userId : r.customerId;
          if (otherParty !== id) {
            await notify(otherParty, 'CUSTOM_ART_CANCELLED', `Request ${r.requestNumber} was cancelled`, 'The other party’s account was closed.', `/account/custom-art/${r.id}`, tx);
          }
        }
      });

      await audit(ctx.user, 'USER_DELETED', 'User', id, { reason, roles: user.roles.map((r) => r.role.name), artistId: user.artist?.id ?? null, cancelledRequests: openRequests.length }, { ip: ctx.ip });
      return ok({ id, deleted: true, cancelledRequests: openRequests.length });
    },
  },
];

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { audit } from '../../shared/audit.js';
import { badRequest, conflict, unauthorized } from '../../shared/errors.js';
import { created, ok, type AuthUser, type RequestContext, type RouteDef } from '../../shared/http.js';
import { parse } from '../../shared/validation.js';
import { uniqueSlug } from '../../utils/slug.js';
import { resolveUser } from '../../middleware/authenticate.js';
import { REFRESH_COOKIE, generateRefreshToken, hashRefreshToken, refreshTtlMs, signAccessToken } from './tokens.js';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
// Compared against when the email is unknown so response timing does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/[0-9]/, 'Password needs a number');

const baseRegister = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(190),
  phone: z.string().trim().max(20).optional(),
  password: passwordSchema,
});

const urlOrEmpty = z.string().trim().url().max(300).optional().or(z.literal('').transform(() => undefined));

const artistRegister = baseRegister.extend({
  displayName: z.string().trim().min(2).max(120),
  artistType: z.enum(['INDIVIDUAL', 'STUDIO', 'GALLERY', 'CREATIVE_BUSINESS']).default('INDIVIDUAL'),
  bio: z.string().trim().max(500).optional(),
  description: z.string().trim().max(5000).optional(),
  artistStatement: z.string().trim().max(5000).optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(80).optional(),
  country: z.string().trim().max(60).default('IN'),
  state: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  address: z.string().trim().max(300).optional(),
  website: urlOrEmpty,
  socialLinks: z.record(z.string(), z.string().url().max(300)).optional(),
  primaryCategoryId: z.string().max(40).optional(),
  styleIds: z.array(z.string().max(40)).max(20).default([]),
  mediumIds: z.array(z.string().max(40)).max(20).default([]),
  specializations: z.array(z.string().trim().max(80)).max(20).default([]),
  awards: z.array(z.string().trim().max(200)).max(30).default([]),
  acceptsCustomArt: z.boolean().default(true),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

async function issueSession(userId: string, ctx: RequestContext) {
  const { token, hash } = generateRefreshToken();
  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hash,
      userAgent: ctx.userAgent?.slice(0, 500),
      ipAddress: ctx.ip,
      expiresAt: new Date(Date.now() + refreshTtlMs()),
    },
  });
  return {
    accessToken: signAccessToken(userId),
    cookie: { name: REFRESH_COOKIE, value: token, maxAgeMs: refreshTtlMs() },
  };
}

async function authPayload(userId: string, ctx: RequestContext, status = 200) {
  const session = await issueSession(userId, ctx);
  const user = await resolveUserById(userId);
  return { status, data: { accessToken: session.accessToken, user }, cookies: [session.cookie] };
}

async function resolveUserById(userId: string): Promise<AuthUser | null> {
  return resolveUser(`Bearer ${signAccessToken(userId)}`);
}

async function roleId(name: 'ADMIN' | 'ARTIST' | 'CUSTOMER') {
  const role = await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  return role.id;
}

export const authRoutes: RouteDef[] = [
  {
    method: 'POST',
    path: '/auth/register',
    rateLimit: 'auth',
    handler: async (ctx) => {
      const input = parse(baseRegister, ctx.body);
      if (await prisma.user.findUnique({ where: { email: input.email } })) throw conflict('An account with this email already exists');
      const user = await prisma.user.create({
        data: {
          email: input.email,
          fullName: input.fullName,
          phone: input.phone,
          passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
          roles: { create: { roleId: await roleId('CUSTOMER') } },
          customerProfile: { create: {} },
          wishlists: { create: { name: 'My Wishlist' } },
        },
      });
      await audit(null, 'USER_REGISTERED', 'User', user.id, { role: 'CUSTOMER' }, { ip: ctx.ip });
      return authPayload(user.id, ctx, 201);
    },
  },
  {
    method: 'POST',
    path: '/auth/register/artist',
    rateLimit: 'auth',
    handler: async (ctx) => {
      const input = parse(artistRegister, ctx.body);
      if (await prisma.user.findUnique({ where: { email: input.email } })) throw conflict('An account with this email already exists');

      const [styles, mediums] = await Promise.all([
        prisma.artworkStyle.findMany({ where: { id: { in: input.styleIds } }, select: { id: true } }),
        prisma.artworkMedium.findMany({ where: { id: { in: input.mediumIds } }, select: { id: true } }),
      ]);
      if (input.primaryCategoryId && !(await prisma.artworkCategory.findUnique({ where: { id: input.primaryCategoryId } }))) {
        throw badRequest('Unknown primary category');
      }

      const [artistRole, customerRole] = await Promise.all([roleId('ARTIST'), roleId('CUSTOMER')]);
      const user = await prisma.user.create({
        data: {
          email: input.email,
          fullName: input.fullName,
          phone: input.phone,
          passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
          roles: { create: [{ roleId: artistRole }, { roleId: customerRole }] },
          customerProfile: { create: {} },
          wishlists: { create: { name: 'My Wishlist' } },
          artist: {
            create: {
              displayName: input.displayName,
              slug: uniqueSlug(input.displayName),
              type: input.artistType,
              status: 'PENDING_APPROVAL',
              acceptsCustomArt: input.acceptsCustomArt,
              styles: { connect: styles },
              mediums: { connect: mediums },
              profile: {
                create: {
                  bio: input.bio,
                  description: input.description,
                  artistStatement: input.artistStatement,
                  yearsOfExperience: input.yearsOfExperience,
                  website: input.website,
                  socialLinks: input.socialLinks,
                  specializations: input.specializations,
                  awards: input.awards,
                  primaryCategoryId: input.primaryCategoryId,
                },
              },
              address: {
                create: { country: input.country, state: input.state, city: input.city, line1: input.address },
              },
              approvals: { create: { toStatus: 'PENDING_APPROVAL', reason: 'Registered' } },
              gallery: {
                create: { name: input.displayName, slug: uniqueSlug(input.displayName), tagline: input.bio },
              },
            },
          },
        },
      });
      await audit(null, 'ARTIST_REGISTERED', 'User', user.id, { displayName: input.displayName }, { ip: ctx.ip });
      // Notify admins of a pending approval.
      const admins = await prisma.user.findMany({ where: { roles: { some: { role: { name: 'ADMIN' } } } }, select: { id: true } });
      if (admins.length) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: 'ARTIST_PENDING',
            title: 'New artist awaiting approval',
            body: `${input.displayName} registered as an artist.`,
            link: '/admin/artists',
          })),
        });
      }
      return authPayload(user.id, ctx, 201);
    },
  },
  {
    method: 'POST',
    path: '/auth/login',
    rateLimit: 'auth',
    handler: async (ctx) => {
      const input = parse(loginSchema, ctx.body);
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      // Constant-ish time: always run a bcrypt compare to avoid user enumeration by timing.
      const hash = user?.passwordHash ?? DUMMY_HASH;
      const valid = await bcrypt.compare(input.password, hash);

      if (!user) throw unauthorized('Invalid email or password');
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw unauthorized('Account temporarily locked after repeated failed logins. Try again later.');
      }
      if (!valid) {
        const failed = user.failedLogins + 1;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLogins: failed >= MAX_FAILED_LOGINS ? 0 : failed,
            lockedUntil: failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : undefined,
          },
        });
        await audit(null, 'LOGIN_FAILED', 'User', user.id, undefined, { ip: ctx.ip });
        throw unauthorized('Invalid email or password');
      }
      if (user.status !== 'ACTIVE') throw unauthorized('This account is not active');

      await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
      return authPayload(user.id, ctx);
    },
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    // Runs on every page load; the token itself is the credential, so the strict login tier would lock out normal browsing.
    rateLimit: 'default',
    sameOrigin: true,
    handler: async (ctx) => {
      const token = ctx.cookies[REFRESH_COOKIE];
      if (!token) throw unauthorized('No session');
      const session = await prisma.session.findUnique({ where: { refreshTokenHash: hashRefreshToken(token) } });
      if (!session) throw unauthorized('Session expired');
      if (session.revokedAt) {
        // Reuse of a rotated token → likely theft. Revoke every session of that user.
        await prisma.session.updateMany({ where: { userId: session.userId, revokedAt: null }, data: { revokedAt: new Date() } });
        await audit(null, 'REFRESH_TOKEN_REUSE', 'User', session.userId, undefined, { ip: ctx.ip });
        throw unauthorized('Session expired');
      }
      if (session.expiresAt < new Date()) throw unauthorized('Session expired');
      await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      const user = await resolveUserById(session.userId);
      if (!user) throw unauthorized('Session expired');
      return authPayload(session.userId, ctx);
    },
  },
  {
    method: 'POST',
    path: '/auth/logout',
    sameOrigin: true,
    handler: async (ctx) => {
      const token = ctx.cookies[REFRESH_COOKIE];
      if (token) {
        await prisma.session.updateMany({
          where: { refreshTokenHash: hashRefreshToken(token), revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return { status: 200, data: { loggedOut: true }, cookies: [{ name: REFRESH_COOKIE, value: '', clear: true }] };
    },
  },
  {
    method: 'GET',
    path: '/auth/me',
    auth: 'required',
    handler: async (ctx) => ok(ctx.user),
  },
  {
    method: 'POST',
    path: '/auth/change-password',
    auth: 'required',
    rateLimit: 'strict',
    handler: async (ctx) => {
      const input = parse(z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema }), ctx.body);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.user!.id } });
      if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) throw badRequest('Current password is incorrect');
      await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS) } }),
        prisma.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
      ]);
      await audit(ctx.user, 'PASSWORD_CHANGED', 'User', user.id, undefined, { ip: ctx.ip });
      return created({ changed: true });
    },
  },
];

import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { badRequest, notFound } from '../../shared/errors.js';
import { created, ok, type RouteDef } from '../../shared/http.js';
import { processAndStoreImage } from '../../shared/images.js';
import { recentlyViewedFor } from '../home/home.routes.js';
import { parse } from '../../shared/validation.js';

const addressBody = z.object({
  label: z.string().trim().max(40).nullable().optional(),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(20),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(60).default('IN'),
  postalCode: z.string().trim().min(3).max(12),
  isDefault: z.boolean().optional(),
});

const meSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  avatarUrl: true,
  createdAt: true,
  roles: { select: { role: { select: { name: true } } } },
  artist: { select: { id: true, slug: true, status: true, displayName: true } },
} as const;

async function me(userId: string) {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: meSelect });
  return { ...u, roles: u.roles.map((r) => r.role.name) };
}

async function ownAddress(userId: string, id: string) {
  const a = await prisma.customerAddress.findFirst({ where: { id, userId } });
  if (!a) throw notFound('Address');
  return a;
}

export const userRoutes: RouteDef[] = [
  { method: 'GET', path: '/users/me', auth: 'required', handler: async (ctx) => ok(await me(ctx.user!.id)) },
  {
    method: 'PATCH',
    path: '/users/me',
    auth: 'required',
    handler: async (ctx) => {
      const input = parse(
        z.object({ fullName: z.string().trim().min(2).max(120).optional(), phone: z.string().trim().max(20).nullable().optional() }),
        ctx.body,
      );
      await prisma.user.update({ where: { id: ctx.user!.id }, data: input });
      return ok(await me(ctx.user!.id));
    },
  },
  {
    method: 'POST',
    path: '/users/me/avatar',
    auth: 'required',
    upload: { field: 'image', maxCount: 1 },
    rateLimit: 'upload',
    handler: async (ctx) => {
      if (!ctx.files[0]) throw badRequest('Attach an image in the "image" field');
      const img = await processAndStoreImage(ctx.files[0], 'site', { maxDimension: 600, thumbnail: false });
      await prisma.user.update({ where: { id: ctx.user!.id }, data: { avatarUrl: img.main.url } });
      return created({ avatarUrl: img.main.url });
    },
  },
  {
    method: 'GET',
    path: '/users/me/addresses',
    auth: 'required',
    handler: async (ctx) =>
      ok(await prisma.customerAddress.findMany({ where: { userId: ctx.user!.id }, orderBy: [{ isDefault: 'desc' }, { id: 'asc' }] })),
  },
  {
    method: 'POST',
    path: '/users/me/addresses',
    auth: 'required',
    handler: async (ctx) => {
      const input = parse(addressBody, ctx.body);
      const userId = ctx.user!.id;
      const count = await prisma.customerAddress.count({ where: { userId } });
      if (count >= 20) throw badRequest('You can save up to 20 addresses');
      const isDefault = input.isDefault ?? count === 0;
      const address = await prisma.$transaction(async (tx) => {
        if (isDefault) await tx.customerAddress.updateMany({ where: { userId }, data: { isDefault: false } });
        return tx.customerAddress.create({ data: { ...input, isDefault, userId } });
      });
      return created(address);
    },
  },
  {
    method: 'PATCH',
    path: '/users/me/addresses/:id',
    auth: 'required',
    handler: async (ctx) => {
      const existing = await ownAddress(ctx.user!.id, ctx.params.id);
      const input = parse(addressBody.partial(), ctx.body);
      const address = await prisma.$transaction(async (tx) => {
        if (input.isDefault) await tx.customerAddress.updateMany({ where: { userId: ctx.user!.id }, data: { isDefault: false } });
        return tx.customerAddress.update({ where: { id: existing.id }, data: input });
      });
      return ok(address);
    },
  },
  {
    method: 'DELETE',
    path: '/users/me/addresses/:id',
    auth: 'required',
    handler: async (ctx) => {
      const existing = await ownAddress(ctx.user!.id, ctx.params.id);
      await prisma.customerAddress.delete({ where: { id: existing.id } });
      if (existing.isDefault) {
        const next = await prisma.customerAddress.findFirst({ where: { userId: ctx.user!.id } });
        if (next) await prisma.customerAddress.update({ where: { id: next.id }, data: { isDefault: true } });
      }
      return ok({ id: existing.id, deleted: true });
    },
  },
  {
    method: 'GET',
    path: '/users/me/recently-viewed',
    auth: 'required',
    handler: async (ctx) => ok(await recentlyViewedFor(ctx.user!.id, 24)),
  },
];

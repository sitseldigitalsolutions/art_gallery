import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { isAdmin } from '../../middleware/authenticate.js';
import { audit } from '../../shared/audit.js';
import { badRequest, forbidden, notFound } from '../../shared/errors.js';
import { created, ok, type AuthUser, type RouteDef } from '../../shared/http.js';
import { processAndStoreImage } from '../../shared/images.js';
import { publicArtworkWhere } from '../../shared/serializers.js';
import { pageMeta, pagination, parse } from '../../shared/validation.js';
import { uniqueSlug } from '../../utils/slug.js';
import { findCards } from '../artworks/artwork.service.js';
import { collectionCardSelect, publicCollectionWhere, toCollectionCard } from './collection.service.js';

const collectionBody = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5000).nullable().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(), // admin only
  artworkIds: z.array(z.string().max(40)).max(200).optional(),
});

/**
 * Artists manage their own collections; admins manage curated (artistId = null) collections
 * and may override any collection. Anything else is a 404 to avoid leaking existence.
 */
async function manageableCollection(user: AuthUser | null, id: string) {
  const c = await prisma.artworkCollection.findUnique({ where: { id } });
  if (!c) throw notFound('Collection');
  if (isAdmin(user)) return c;
  if (!user?.artistId || c.artistId !== user.artistId) throw notFound('Collection');
  return c;
}

/** Artists can only place their own artworks into collections; admins can curate any artwork. */
async function permittedArtworkIds(user: AuthUser | null, ids: string[]) {
  if (!ids.length) return [];
  const where: Prisma.ArtworkWhereInput = isAdmin(user) ? { id: { in: ids } } : { id: { in: ids }, artistId: user?.artistId ?? '__none__' };
  const found = await prisma.artwork.findMany({ where, select: { id: true } });
  if (found.length !== new Set(ids).size) throw notFound('Artwork');
  return found.map((a) => a.id);
}

async function managedDetail(id: string) {
  const c = await prisma.artworkCollection.findUniqueOrThrow({
    where: { id },
    select: {
      ...collectionCardSelect,
      items: {
        orderBy: { sortOrder: 'asc' },
        select: {
          artworkId: true,
          artwork: {
            select: {
              thumbnailUrl: true,
              previewUrl: true,
              title: true,
              status: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true, thumbUrl: true } },
            },
          },
        },
      },
    },
  });
  const card = toCollectionCard({ ...c, items: c.items.slice(0, 4) });
  return {
    ...card,
    artworkCount: c.items.length,
    items: c.items.map((i) => ({
      artworkId: i.artworkId,
      title: i.artwork.title,
      status: i.artwork.status,
      thumbnailUrl: i.artwork.thumbnailUrl ?? i.artwork.images[0]?.thumbUrl ?? null,
    })),
  };
}

export const collectionRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/artists/me/collections',
    roles: ['ARTIST', 'ADMIN'],
    handler: async (ctx) => {
      // Admins without an artist profile see the curated (platform) collections.
      const where: Prisma.ArtworkCollectionWhereInput = ctx.user!.artistId && !(isAdmin(ctx.user) && ctx.query.curated === 'true')
        ? { artistId: ctx.user!.artistId }
        : { artistId: null };
      const rows = await prisma.artworkCollection.findMany({ where, orderBy: { updatedAt: 'desc' }, select: { id: true } });
      return ok(await Promise.all(rows.map((r) => managedDetail(r.id))));
    },
  },
  {
    method: 'POST',
    path: '/collections',
    roles: ['ARTIST', 'ADMIN'],
    handler: async (ctx) => {
      const input = parse(collectionBody, ctx.body);
      const admin = isAdmin(ctx.user);
      if (!admin && !ctx.user!.artistId) throw forbidden('An artist account is required');
      const artistId = admin && !(ctx.user!.artistId && ctx.query.asArtist === 'true') ? null : ctx.user!.artistId;
      const artworkIds = await permittedArtworkIds(ctx.user, input.artworkIds ?? []);
      const c = await prisma.artworkCollection.create({
        data: {
          name: input.name,
          slug: uniqueSlug(input.name),
          description: input.description,
          isPublished: input.isPublished ?? true,
          isFeatured: admin ? (input.isFeatured ?? false) : false,
          artistId,
          items: { create: artworkIds.map((artworkId, i) => ({ artworkId, sortOrder: i })) },
        },
      });
      await audit(ctx.user, 'COLLECTION_CREATED', 'ArtworkCollection', c.id, { name: c.name }, { ip: ctx.ip });
      return created(await managedDetail(c.id));
    },
  },
  {
    method: 'PATCH',
    path: '/collections/:id',
    roles: ['ARTIST', 'ADMIN'],
    handler: async (ctx) => {
      const c = await manageableCollection(ctx.user, ctx.params.id);
      const input = parse(collectionBody.partial(), ctx.body);
      if (input.artworkIds) {
        const ids = await permittedArtworkIds(ctx.user, input.artworkIds);
        await prisma.$transaction([
          prisma.collectionItem.deleteMany({ where: { collectionId: c.id } }),
          prisma.collectionItem.createMany({ data: ids.map((artworkId, i) => ({ collectionId: c.id, artworkId, sortOrder: i })) }),
        ]);
      }
      await prisma.artworkCollection.update({
        where: { id: c.id },
        data: {
          name: input.name,
          description: input.description,
          isPublished: input.isPublished,
          isFeatured: isAdmin(ctx.user) ? input.isFeatured : undefined,
        },
      });
      await audit(ctx.user, 'COLLECTION_UPDATED', 'ArtworkCollection', c.id, { fields: Object.keys(input) }, { ip: ctx.ip });
      return ok(await managedDetail(c.id));
    },
  },
  {
    method: 'DELETE',
    path: '/collections/:id',
    roles: ['ARTIST', 'ADMIN'],
    handler: async (ctx) => {
      const c = await manageableCollection(ctx.user, ctx.params.id);
      await prisma.artworkCollection.delete({ where: { id: c.id } });
      await audit(ctx.user, 'COLLECTION_DELETED', 'ArtworkCollection', c.id, { name: c.name }, { ip: ctx.ip });
      return ok({ id: c.id, deleted: true });
    },
  },
  {
    method: 'POST',
    path: '/collections/:id/items',
    roles: ['ARTIST', 'ADMIN'],
    handler: async (ctx) => {
      const c = await manageableCollection(ctx.user, ctx.params.id);
      const { artworkId } = parse(z.object({ artworkId: z.string().min(1).max(40) }), ctx.body);
      // Even admins add only the collection owner's artworks to an artist collection.
      const owner = c.artistId;
      const artwork = await prisma.artwork.findFirst({
        where: { id: artworkId, ...(owner ? { artistId: owner } : {}), ...(!isAdmin(ctx.user) ? { artistId: ctx.user!.artistId ?? '__none__' } : {}) },
      });
      if (!artwork) throw notFound('Artwork');
      const max = await prisma.collectionItem.aggregate({ where: { collectionId: c.id }, _max: { sortOrder: true } });
      await prisma.collectionItem.upsert({
        where: { collectionId_artworkId: { collectionId: c.id, artworkId } },
        update: {},
        create: { collectionId: c.id, artworkId, sortOrder: (max._max.sortOrder ?? -1) + 1 },
      });
      return created(await managedDetail(c.id));
    },
  },
  {
    method: 'DELETE',
    path: '/collections/:id/items/:artworkId',
    roles: ['ARTIST', 'ADMIN'],
    handler: async (ctx) => {
      const c = await manageableCollection(ctx.user, ctx.params.id);
      await prisma.collectionItem.deleteMany({ where: { collectionId: c.id, artworkId: ctx.params.artworkId } });
      return ok(await managedDetail(c.id));
    },
  },
  {
    method: 'POST',
    path: '/collections/:id/cover',
    roles: ['ARTIST', 'ADMIN'],
    upload: { field: 'image', maxCount: 1 },
    rateLimit: 'upload',
    handler: async (ctx) => {
      const c = await manageableCollection(ctx.user, ctx.params.id);
      if (!ctx.files[0]) throw badRequest('Attach an image in the "image" field');
      const img = await processAndStoreImage(ctx.files[0], 'artworks', { minWidth: 600, minHeight: 400, thumbnail: false });
      await prisma.artworkCollection.update({ where: { id: c.id }, data: { coverImageUrl: img.main.url } });
      return created({ coverImageUrl: img.main.url });
    },
  },
  {
    method: 'GET',
    path: '/collections',
    handler: async (ctx) => {
      const q = parse(
        pagination.extend({
          featured: z.enum(['true', 'false']).optional(),
          artist: z.string().max(120).optional(),
          q: z.string().trim().max(120).optional(),
        }),
        ctx.query,
      );
      const where: Prisma.ArtworkCollectionWhereInput = {
        AND: [
          publicCollectionWhere,
          q.featured === 'true' ? { isFeatured: true } : {},
          q.artist ? { artist: { slug: q.artist } } : {},
          q.q ? { name: { contains: q.q } } : {},
          { items: { some: { artwork: publicArtworkWhere } } },
        ],
      };
      const [total, rows] = await Promise.all([
        prisma.artworkCollection.count({ where }),
        prisma.artworkCollection.findMany({
          where,
          orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
          select: collectionCardSelect,
        }),
      ]);
      return ok(rows.map(toCollectionCard), pageMeta(q.page, q.pageSize, total));
    },
  },
  {
    method: 'GET',
    path: '/collections/:slug',
    handler: async (ctx) => {
      const c = await prisma.artworkCollection.findFirst({
        where: { AND: [publicCollectionWhere, { OR: [{ slug: ctx.params.slug }, { id: ctx.params.slug }] }] },
        select: collectionCardSelect,
      });
      if (!c) throw notFound('Collection');
      const items = await prisma.collectionItem.findMany({
        where: { collectionId: c.id, artwork: publicArtworkWhere },
        orderBy: { sortOrder: 'asc' },
        select: { artworkId: true },
      });
      const order = new Map(items.map((i, idx) => [i.artworkId, idx]));
      const artworks = (await findCards({ id: { in: items.map((i) => i.artworkId) } }, undefined, 200)).sort(
        (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
      );
      return ok({ ...toCollectionCard(c), artworks });
    },
  },
];

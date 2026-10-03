import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { audit } from '../../shared/audit.js';
import { badRequest, forbidden, notFound } from '../../shared/errors.js';
import { created, ok, type RouteDef } from '../../shared/http.js';
import { processAndStoreImage } from '../../shared/images.js';
import { artistCardSelect, publicArtworkWhere, toArtistCard } from '../../shared/serializers.js';
import { pageMeta, pagination, parse } from '../../shared/validation.js';
import { findCards } from '../artworks/artwork.service.js';
import { collectionCardSelect, publicCollectionWhere, toCollectionCard } from '../collections/collection.service.js';
import { galleryCardSelect, publicGalleryWhere, toGalleryCard } from './gallery.service.js';

async function ownGallery(artistId: string | null | undefined) {
  if (!artistId) throw forbidden('An artist account is required');
  const gallery = await prisma.gallery.findUnique({ where: { artistId } });
  if (!gallery) throw notFound('Gallery');
  return gallery;
}

export const galleryRoutes: RouteDef[] = [
  {
    method: 'PATCH',
    path: '/galleries/me',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const gallery = await ownGallery(ctx.user?.artistId);
      const input = parse(
        z.object({
          name: z.string().trim().min(2).max(120).optional(),
          tagline: z.string().trim().max(200).nullable().optional(),
          description: z.string().trim().max(10000).nullable().optional(),
        }),
        ctx.body,
      );
      const updated = await prisma.gallery.update({ where: { id: gallery.id }, data: input });
      await audit(ctx.user, 'GALLERY_UPDATED', 'Gallery', gallery.id, { fields: Object.keys(input) }, { ip: ctx.ip });
      return ok(updated);
    },
  },
  {
    method: 'POST',
    path: '/galleries/me/cover',
    roles: ['ARTIST'],
    upload: { field: 'image', maxCount: 1 },
    rateLimit: 'upload',
    handler: async (ctx) => {
      const gallery = await ownGallery(ctx.user?.artistId);
      if (!ctx.files[0]) throw badRequest('Attach an image in the "image" field');
      const img = await processAndStoreImage(ctx.files[0], 'galleries', { minWidth: 800, minHeight: 300, thumbnail: false });
      await prisma.gallery.update({ where: { id: gallery.id }, data: { coverImageUrl: img.main.url } });
      return created({ coverImageUrl: img.main.url });
    },
  },
  {
    method: 'GET',
    path: '/galleries',
    handler: async (ctx) => {
      const q = parse(pagination.extend({ q: z.string().trim().max(120).optional(), featured: z.enum(['true', 'false']).optional() }), ctx.query);
      const where = {
        AND: [
          publicGalleryWhere,
          q.q ? { OR: [{ name: { contains: q.q } }, { tagline: { contains: q.q } }] } : {},
          q.featured === 'true' ? { OR: [{ isFeatured: true }, { artist: { isFeatured: true } }] } : {},
        ],
      };
      const [total, rows] = await Promise.all([
        prisma.gallery.count({ where }),
        prisma.gallery.findMany({
          where,
          orderBy: [{ isFeatured: 'desc' }, { artist: { followerCount: 'desc' } }],
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
          select: galleryCardSelect,
        }),
      ]);
      return ok(rows.map(toGalleryCard), pageMeta(q.page, q.pageSize, total));
    },
  },
  {
    method: 'GET',
    path: '/galleries/:slug',
    handler: async (ctx) => {
      const g = await prisma.gallery.findFirst({
        where: { AND: [publicGalleryWhere, { OR: [{ slug: ctx.params.slug }, { id: ctx.params.slug }] }] },
        select: { ...galleryCardSelect, description: true, artistId: true, artist: { select: { ...galleryCardSelect.artist.select, ...artistCardSelect } } },
      });
      if (!g) throw notFound('Gallery');
      const [galleryCollections, artistCollections, artworks] = await Promise.all([
        prisma.galleryCollection.findMany({
          where: { galleryId: g.id, collection: publicCollectionWhere },
          orderBy: { sortOrder: 'asc' },
          select: { collection: { select: collectionCardSelect } },
        }),
        prisma.artworkCollection.findMany({
          where: { AND: [publicCollectionWhere, { artistId: g.artistId }] },
          orderBy: { createdAt: 'desc' },
          select: collectionCardSelect,
        }),
        findCards({ AND: [publicArtworkWhere, { artistId: g.artistId }] }, [{ isFeatured: 'desc' }, { publishedAt: 'desc' }], 48),
      ]);
      const seen = new Set<string>();
      const collections = [...galleryCollections.map((gc) => gc.collection), ...artistCollections]
        .filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)))
        .map(toCollectionCard);
      return ok({
        ...toGalleryCard(g),
        description: g.description,
        artist: toArtistCard(g.artist),
        collections,
        artworks,
      });
    },
  },
];

import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { audit } from '../../shared/audit.js';
import { conflict, forbidden, notFound } from '../../shared/errors.js';
import { created, ok, type RouteDef } from '../../shared/http.js';
import { processAndStoreImage } from '../../shared/images.js';
import { publicArtistWhere, publicArtworkWhere } from '../../shared/serializers.js';
import { pageMeta, pagination, parse } from '../../shared/validation.js';

const reviewBody = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(160).optional(),
  body: z.string().trim().max(5000).optional(),
});

/** Order items that count as a completed purchase (delivered, digital available, or order completed). */
const purchasedItemWhere = (userId: string) => ({
  order: { customerId: userId, status: { not: 'CANCELLED' as const } },
  OR: [
    { fulfillmentStatus: { in: ['DELIVERED' as const, 'DIGITAL_AVAILABLE' as const] } },
    { order: { status: 'COMPLETED' as const } },
  ],
});

async function recomputeArtworkRating(artworkId: string) {
  const agg = await prisma.artworkReview.aggregate({ where: { artworkId, status: 'APPROVED' }, _avg: { rating: true }, _count: { _all: true } });
  await prisma.artwork.update({
    where: { id: artworkId },
    data: { ratingAverage: Math.round((agg._avg.rating ?? 0) * 100) / 100, ratingCount: agg._count._all },
  });
}

async function recomputeArtistRating(artistId: string) {
  const agg = await prisma.artistReview.aggregate({ where: { artistId, status: 'APPROVED' }, _avg: { rating: true }, _count: { _all: true } });
  await prisma.artist.update({
    where: { id: artistId },
    data: { ratingAverage: Math.round((agg._avg.rating ?? 0) * 100) / 100, ratingCount: agg._count._all },
  });
}

async function summary(where: { artworkId?: string; artistId?: string }) {
  const groups = await (where.artworkId
    ? prisma.artworkReview.groupBy({ by: ['rating'], where: { artworkId: where.artworkId, status: 'APPROVED' }, _count: { _all: true } })
    : prisma.artistReview.groupBy({ by: ['rating'], where: { artistId: where.artistId!, status: 'APPROVED' }, _count: { _all: true } }));
  const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  let count = 0;
  let total = 0;
  for (const g of groups) {
    distribution[String(g.rating)] = g._count._all;
    count += g._count._all;
    total += g.rating * g._count._all;
  }
  return { average: count ? Math.round((total / count) * 100) / 100 : 0, count, distribution };
}

// Exported so admin moderation (workstream B) can keep aggregates consistent after status changes.
export { recomputeArtistRating, recomputeArtworkRating };

export const reviewRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/reviews/artwork/:artworkId',
    handler: async (ctx) => {
      const q = parse(pagination, ctx.query);
      const where = { artworkId: ctx.params.artworkId, status: 'APPROVED' as const };
      const [total, rows, sum] = await Promise.all([
        prisma.artworkReview.count({ where }),
        prisma.artworkReview.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
          select: {
            id: true,
            rating: true,
            title: true,
            body: true,
            verifiedPurchase: true,
            createdAt: true,
            user: { select: { fullName: true, avatarUrl: true } },
            images: { select: { id: true, url: true } },
          },
        }),
        summary({ artworkId: ctx.params.artworkId }),
      ]);
      return ok(rows, { ...pageMeta(q.page, q.pageSize, total), summary: sum });
    },
  },
  {
    method: 'POST',
    path: '/reviews/artwork/:artworkId',
    auth: 'required',
    upload: { field: 'images', maxCount: 4 },
    rateLimit: 'strict',
    handler: async (ctx) => {
      const input = parse(reviewBody, ctx.body);
      const artwork = await prisma.artwork.findFirst({ where: { AND: [publicArtworkWhere, { id: ctx.params.artworkId }] }, select: { id: true, artistId: true } });
      if (!artwork) throw notFound('Artwork');
      const purchase = await prisma.orderItem.findFirst({ where: { artworkId: artwork.id, ...purchasedItemWhere(ctx.user!.id) }, select: { id: true } });
      if (!purchase) throw forbidden('Only customers who received this artwork can review it');
      if (await prisma.artworkReview.findUnique({ where: { artworkId_userId: { artworkId: artwork.id, userId: ctx.user!.id } } })) {
        throw conflict('You have already reviewed this artwork');
      }
      const images = [];
      for (const f of ctx.files) images.push(await processAndStoreImage(f, 'reviews', { thumbnail: false, maxDimension: 1600 }));
      const review = await prisma.artworkReview.create({
        data: {
          artworkId: artwork.id,
          userId: ctx.user!.id,
          orderItemId: purchase.id,
          rating: input.rating,
          title: input.title,
          body: input.body,
          verifiedPurchase: true,
          status: 'APPROVED',
          images: { create: images.map((i) => ({ url: i.main.url!, storageKey: i.main.key })) },
        },
        include: { images: { select: { id: true, url: true } } },
      });
      await recomputeArtworkRating(artwork.id);
      await audit(ctx.user, 'ARTWORK_REVIEW_CREATED', 'ArtworkReview', review.id, { rating: input.rating }, { ip: ctx.ip });
      return created(review);
    },
  },
  {
    method: 'GET',
    path: '/reviews/artist/:artistId',
    handler: async (ctx) => {
      const q = parse(pagination, ctx.query);
      const where = { artistId: ctx.params.artistId, status: 'APPROVED' as const };
      const [total, rows, sum] = await Promise.all([
        prisma.artistReview.count({ where }),
        prisma.artistReview.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
          select: { id: true, rating: true, body: true, verifiedPurchase: true, createdAt: true, user: { select: { fullName: true, avatarUrl: true } } },
        }),
        summary({ artistId: ctx.params.artistId }),
      ]);
      return ok(rows, { ...pageMeta(q.page, q.pageSize, total), summary: sum });
    },
  },
  {
    method: 'POST',
    path: '/reviews/artist/:artistId',
    auth: 'required',
    rateLimit: 'strict',
    handler: async (ctx) => {
      const input = parse(reviewBody.omit({ title: true }), ctx.body);
      const artist = await prisma.artist.findFirst({ where: { AND: [publicArtistWhere, { id: ctx.params.artistId }] }, select: { id: true, userId: true } });
      if (!artist) throw notFound('Artist');
      if (artist.userId === ctx.user!.id) throw forbidden('You cannot review yourself');
      const [purchase, customArt] = await Promise.all([
        prisma.orderItem.count({ where: { artistId: artist.id, ...purchasedItemWhere(ctx.user!.id) } }),
        prisma.customArtRequest.count({ where: { artistId: artist.id, customerId: ctx.user!.id, status: 'COMPLETED' } }),
      ]);
      if (!purchase && !customArt) throw forbidden('Only customers who purchased from this artist can review them');
      if (await prisma.artistReview.findUnique({ where: { artistId_userId: { artistId: artist.id, userId: ctx.user!.id } } })) {
        throw conflict('You have already reviewed this artist');
      }
      const review = await prisma.artistReview.create({
        data: { artistId: artist.id, userId: ctx.user!.id, rating: input.rating, body: input.body, verifiedPurchase: true, status: 'APPROVED' },
      });
      await recomputeArtistRating(artist.id);
      await audit(ctx.user, 'ARTIST_REVIEW_CREATED', 'ArtistReview', review.id, { rating: input.rating }, { ip: ctx.ip });
      return created(review);
    },
  },
];

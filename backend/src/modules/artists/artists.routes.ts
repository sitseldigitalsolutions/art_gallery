import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { audit } from '../../shared/audit.js';
import { badRequest, forbidden, notFound } from '../../shared/errors.js';
import { created, ok, type RouteDef } from '../../shared/http.js';
import { processAndStoreImage } from '../../shared/images.js';
import {
  artistCardSelect,
  money,
  publicArtistWhere,
  publicArtworkWhere,
  refSelect,
  toArtistCard,
} from '../../shared/serializers.js';
import { pageMeta, pagination, parse } from '../../shared/validation.js';
import { artworkOrderBy, findCards } from '../artworks/artwork.service.js';
import { galleryCardSelect, toGalleryCard } from '../galleries/gallery.service.js';

const urlOrNull = z.string().trim().url().max(300).nullable().optional().or(z.literal('').transform(() => null));

const profileBody = z.object({
  displayName: z.string().trim().min(2).max(120).optional(),
  type: z.enum(['INDIVIDUAL', 'STUDIO', 'GALLERY', 'CREATIVE_BUSINESS']).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  artistStatement: z.string().trim().max(5000).nullable().optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(80).nullable().optional(),
  website: urlOrNull,
  socialLinks: z.record(z.string(), z.string().url().max(300)).nullable().optional(),
  specializations: z.array(z.string().trim().max(80)).max(20).optional(),
  awards: z.array(z.string().trim().max(200)).max(30).optional(),
  primaryCategoryId: z.string().max(40).nullable().optional(),
  styleIds: z.array(z.string().max(40)).max(20).optional(),
  mediumIds: z.array(z.string().max(40)).max(20).optional(),
  acceptsCustomArt: z.boolean().optional(),
  customArtBasePrice: z.coerce.number().min(0).max(10_000_000).nullable().optional(),
  phone: z.string().trim().max(20).optional(),
  country: z.string().trim().max(60).optional(),
  state: z.string().trim().max(80).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  postalCode: z.string().trim().max(20).nullable().optional(),
});

function requireArtistId(artistId: string | null | undefined) {
  if (!artistId) throw forbidden('An artist account is required');
  return artistId;
}

async function ownProfile(artistId: string) {
  const a = await prisma.artist.findUniqueOrThrow({
    where: { id: artistId },
    include: {
      user: { select: { email: true, fullName: true, phone: true } },
      profile: { include: { primaryCategory: { select: refSelect } } },
      address: true,
      gallery: true,
      styles: { select: refSelect },
      mediums: { select: refSelect },
      approvals: { orderBy: { createdAt: 'desc' }, take: 20, select: { fromStatus: true, toStatus: true, reason: true, createdAt: true } },
    },
  });
  return {
    ...a,
    customArtBasePrice: money(a.customArtBasePrice),
    ratingAverage: money(a.ratingAverage) ?? 0,
  };
}

const meRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/artists/me',
    roles: ['ARTIST'],
    handler: async (ctx) => ok(await ownProfile(requireArtistId(ctx.user?.artistId))),
  },
  {
    method: 'PATCH',
    path: '/artists/me',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const artistId = requireArtistId(ctx.user?.artistId);
      const input = parse(profileBody, ctx.body);
      if (input.primaryCategoryId && !(await prisma.artworkCategory.findUnique({ where: { id: input.primaryCategoryId } }))) {
        throw badRequest('Unknown primary category');
      }
      const [styles, mediums] = await Promise.all([
        input.styleIds ? prisma.artworkStyle.findMany({ where: { id: { in: input.styleIds } }, select: { id: true } }) : null,
        input.mediumIds ? prisma.artworkMedium.findMany({ where: { id: { in: input.mediumIds } }, select: { id: true } }) : null,
      ]);
      const profile: Prisma.ArtistProfileUncheckedUpdateInput = {};
      for (const k of ['bio', 'description', 'artistStatement', 'yearsOfExperience', 'website', 'primaryCategoryId'] as const) {
        if (input[k] !== undefined) (profile as Record<string, unknown>)[k] = input[k];
      }
      if (input.socialLinks !== undefined) profile.socialLinks = input.socialLinks ?? undefined;
      if (input.specializations) profile.specializations = input.specializations;
      if (input.awards) profile.awards = input.awards;

      const address: Prisma.ArtistAddressUncheckedUpdateInput = {};
      if (input.country !== undefined) address.country = input.country;
      if (input.state !== undefined) address.state = input.state;
      if (input.city !== undefined) address.city = input.city;
      if (input.address !== undefined) address.line1 = input.address;
      if (input.postalCode !== undefined) address.postalCode = input.postalCode;

      await prisma.artist.update({
        where: { id: artistId },
        data: {
          displayName: input.displayName,
          type: input.type,
          acceptsCustomArt: input.acceptsCustomArt,
          customArtBasePrice: input.customArtBasePrice,
          ...(styles ? { styles: { set: styles } } : {}),
          ...(mediums ? { mediums: { set: mediums } } : {}),
          profile: { upsert: { create: profile as Prisma.ArtistProfileCreateWithoutArtistInput, update: profile } },
          address: { upsert: { create: address as Prisma.ArtistAddressCreateWithoutArtistInput, update: address } },
        },
      });
      if (input.phone !== undefined) await prisma.user.update({ where: { id: ctx.user!.id }, data: { phone: input.phone } });
      await audit(ctx.user, 'ARTIST_PROFILE_UPDATED', 'Artist', artistId, { fields: Object.keys(input) }, { ip: ctx.ip });
      return ok(await ownProfile(artistId));
    },
  },
  {
    method: 'POST',
    path: '/artists/me/avatar',
    roles: ['ARTIST'],
    upload: { field: 'image', maxCount: 1 },
    rateLimit: 'upload',
    handler: async (ctx) => {
      const artistId = requireArtistId(ctx.user?.artistId);
      if (!ctx.files[0]) throw badRequest('Attach an image in the "image" field');
      const img = await processAndStoreImage(ctx.files[0], 'artists', { maxDimension: 800, thumbnail: false });
      await prisma.artist.update({ where: { id: artistId }, data: { avatarUrl: img.main.url } });
      await prisma.user.update({ where: { id: ctx.user!.id }, data: { avatarUrl: img.main.url } });
      return created({ avatarUrl: img.main.url });
    },
  },
  {
    method: 'POST',
    path: '/artists/me/cover',
    roles: ['ARTIST'],
    upload: { field: 'image', maxCount: 1 },
    rateLimit: 'upload',
    handler: async (ctx) => {
      const artistId = requireArtistId(ctx.user?.artistId);
      if (!ctx.files[0]) throw badRequest('Attach an image in the "image" field');
      const img = await processAndStoreImage(ctx.files[0], 'artists', { minWidth: 800, minHeight: 300, thumbnail: false });
      await prisma.artist.update({ where: { id: artistId }, data: { coverImageUrl: img.main.url } });
      return created({ coverImageUrl: img.main.url });
    },
  },
  {
    method: 'GET',
    path: '/artists/me/dashboard',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const artistId = requireArtistId(ctx.user?.artistId);
      const [artist, byStatus, sales, orderGroups, pendingCustom, ledger, recentItems, recentRequests] = await Promise.all([
        prisma.artist.findUniqueOrThrow({ where: { id: artistId }, select: { status: true, followerCount: true } }),
        prisma.artwork.groupBy({ by: ['status'], where: { artistId }, _count: { _all: true } }),
        prisma.orderItem.aggregate({ where: { artistId, order: { status: { not: 'CANCELLED' } } }, _sum: { lineTotal: true } }),
        prisma.orderItem.groupBy({ by: ['orderId'], where: { artistId, order: { status: { not: 'CANCELLED' } } } }),
        prisma.customArtRequest.count({ where: { artistId, status: { in: ['REQUESTED', 'ARTIST_REVIEWING', 'REVISION_REQUESTED'] } } }),
        prisma.artistLedger.groupBy({ by: ['type', 'status'], where: { artistId }, _sum: { amount: true } }),
        prisma.orderItem.findMany({
          where: { artistId },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            titleSnapshot: true,
            imageSnapshot: true,
            lineTotal: true,
            artistAmount: true,
            fulfillmentStatus: true,
            createdAt: true,
            order: { select: { id: true, orderNumber: true, status: true, paymentStatus: true } },
          },
        }),
        prisma.customArtRequest.findMany({
          where: { artistId },
          orderBy: { updatedAt: 'desc' },
          take: 6,
          select: { id: true, requestNumber: true, status: true, title: true, createdAt: true, updatedAt: true, customer: { select: { fullName: true } } },
        }),
      ]);
      const count = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;
      const sum = (filter: (r: (typeof ledger)[number]) => boolean) =>
        Math.round(ledger.filter(filter).reduce((acc, r) => acc + Number(r._sum.amount ?? 0), 0) * 100) / 100;
      const isEarning = (r: (typeof ledger)[number]) => r.type !== 'SETTLEMENT_DEBIT' && r.status !== 'REVERSED';
      return ok({
        status: artist.status,
        counts: {
          draft: count('DRAFT'),
          pending: count('PENDING_REVIEW'),
          approved: count('APPROVED'),
          rejected: count('REJECTED'),
          soldOut: count('SOLD_OUT'),
          suspended: count('SUSPENDED'),
          total: byStatus.filter((b) => b.status !== 'ARCHIVED').reduce((a, b) => a + b._count._all, 0),
        },
        followers: artist.followerCount,
        totalSales: Number(sales._sum.lineTotal ?? 0),
        ordersCount: orderGroups.length,
        pendingCustomRequests: pendingCustom,
        earnings: {
          gross: sum((r) => r.type === 'SALE_CREDIT' && r.status !== 'REVERSED'),
          net: sum(isEarning),
          pending: sum((r) => isEarning(r) && r.status === 'PENDING'),
          available: sum((r) => r.status === 'AVAILABLE'),
        },
        recentOrders: recentItems.map((i) => ({
          orderItemId: i.id,
          orderId: i.order.id,
          orderNumber: i.order.orderNumber,
          orderStatus: i.order.status,
          paymentStatus: i.order.paymentStatus,
          title: i.titleSnapshot,
          image: i.imageSnapshot,
          lineTotal: Number(i.lineTotal),
          artistAmount: Number(i.artistAmount),
          fulfillmentStatus: i.fulfillmentStatus,
          createdAt: i.createdAt,
        })),
        recentRequests: recentRequests.map((r) => ({
          id: r.id,
          requestNumber: r.requestNumber,
          status: r.status,
          title: r.title,
          customerName: r.customer.fullName,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      });
    },
  },
];

const publicRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/artists',
    handler: async (ctx) => {
      const q = parse(
        pagination.extend({
          q: z.string().trim().max(120).optional(),
          style: z.string().max(120).optional(),
          featured: z.enum(['true', 'false']).optional(),
          customArt: z.enum(['true', 'false']).optional(),
          sort: z.enum(['popular', 'newest', 'rating']).default('popular'),
        }),
        ctx.query,
      );
      const and: Prisma.ArtistWhereInput[] = [publicArtistWhere];
      if (q.q) {
        and.push({
          OR: [
            { displayName: { contains: q.q } },
            { gallery: { name: { contains: q.q } } },
            { address: { city: { contains: q.q } } },
            { profile: { bio: { contains: q.q } } },
          ],
        });
      }
      if (q.style) and.push({ styles: { some: { slug: q.style } } });
      if (q.featured === 'true') and.push({ isFeatured: true });
      if (q.customArt === 'true') and.push({ acceptsCustomArt: true });
      const orderBy: Prisma.ArtistOrderByWithRelationInput[] =
        q.sort === 'newest'
          ? [{ createdAt: 'desc' }]
          : q.sort === 'rating'
            ? [{ ratingAverage: 'desc' }, { ratingCount: 'desc' }]
            : [{ followerCount: 'desc' }, { createdAt: 'desc' }];
      const where = { AND: and };
      const [total, rows] = await Promise.all([
        prisma.artist.count({ where }),
        prisma.artist.findMany({ where, orderBy, skip: (q.page - 1) * q.pageSize, take: q.pageSize, select: artistCardSelect }),
      ]);
      return ok(rows.map(toArtistCard), pageMeta(q.page, q.pageSize, total));
    },
  },
  {
    method: 'GET',
    path: '/artists/:slug',
    auth: 'optional',
    handler: async (ctx) => {
      const a = await prisma.artist.findFirst({
        where: { AND: [publicArtistWhere, { OR: [{ slug: ctx.params.slug }, { id: ctx.params.slug }] }] },
        select: {
          ...artistCardSelect,
          profile: {
            select: {
              bio: true,
              description: true,
              artistStatement: true,
              yearsOfExperience: true,
              website: true,
              socialLinks: true,
              specializations: true,
              awards: true,
            },
          },
          mediums: { select: refSelect },
          gallery: { select: galleryCardSelect },
        },
      });
      if (!a) throw notFound('Artist');
      const [isFollowing, sold, featuredArtworks] = await Promise.all([
        ctx.user
          ? prisma.artistFollow.findUnique({ where: { userId_artistId: { userId: ctx.user.id, artistId: a.id } } }).then(Boolean)
          : false,
        prisma.artwork.aggregate({ where: { artistId: a.id }, _sum: { salesCount: true } }),
        findCards({ AND: [publicArtworkWhere, { artistId: a.id }] }, [{ isFeatured: 'desc' }, ...artworkOrderBy('trending')], 8),
      ]);
      const { profile, mediums, gallery } = a;
      return ok({
        ...toArtistCard(a),
        profile: {
          description: profile?.description ?? null,
          artistStatement: profile?.artistStatement ?? null,
          yearsOfExperience: profile?.yearsOfExperience ?? null,
          website: profile?.website ?? null,
          socialLinks: profile?.socialLinks ?? null,
          specializations: profile?.specializations ?? [],
          awards: profile?.awards ?? [],
        },
        mediums,
        gallery: gallery ? toGalleryCard(gallery) : null,
        isFollowing,
        soldCount: sold._sum.salesCount ?? 0,
        featuredArtworks,
      });
    },
  },
  {
    method: 'GET',
    path: '/artists/:slug/artworks',
    handler: async (ctx) => {
      const q = parse(
        pagination.extend({
          sold: z.enum(['true', 'false']).optional(),
          sort: z.enum(['newest', 'price_asc', 'price_desc', 'trending', 'popular']).default('newest'),
        }),
        ctx.query,
      );
      const artist = await prisma.artist.findFirst({
        where: { AND: [publicArtistWhere, { OR: [{ slug: ctx.params.slug }, { id: ctx.params.slug }] }] },
        select: { id: true },
      });
      if (!artist) throw notFound('Artist');
      const where: Prisma.ArtworkWhereInput = {
        AND: [
          publicArtworkWhere,
          { artistId: artist.id },
          q.sold === 'true' ? { OR: [{ status: 'SOLD_OUT' }, { salesCount: { gt: 0 } }] } : {},
        ],
      };
      const [total, data] = await Promise.all([
        prisma.artwork.count({ where }),
        findCards(where, artworkOrderBy(q.sort), q.pageSize, (q.page - 1) * q.pageSize),
      ]);
      return ok(data, pageMeta(q.page, q.pageSize, total));
    },
  },
];

export const artistRoutes: RouteDef[] = [...meRoutes, ...publicRoutes];

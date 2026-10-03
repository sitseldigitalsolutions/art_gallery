import type { ArtistStatus, ArtworkStatus, OrderStatus, PaymentStatus, Prisma, ReportStatus, ReviewStatus, RoleName, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { createSignedFileUrl } from '../../providers/storage/signed-url.js';
import { audit, notify } from '../../shared/audit.js';
import { badRequest, conflict, notFound } from '../../shared/errors.js';
import { created, ok, type RouteDef } from '../../shared/http.js';
import { processAndStoreImage } from '../../shared/images.js';
import { artistMiniSelect, artworkCardSelect, money, toArtworkCard } from '../../shared/serializers.js';
import { pageMeta, pagination, parse } from '../../shared/validation.js';
import { loadOrderDetail, orderSummary } from '../orders/order-helpers.js';
import { cancelOrder } from '../orders/orders.routes.js';
import { recomputeArtistRating, recomputeArtworkRating } from '../reviews/reviews.routes.js';
import { SITE_CONFIG_KEY } from '../site-config/site-config.routes.js';

const ADMIN: RoleName[] = ['ADMIN'];

const safeLink = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v.startsWith('/') || /^https:\/\//.test(v), 'Link must be a relative path or an https URL')
  .refine((v) => !v.startsWith('//'), 'Protocol-relative links are not allowed');


const moderationTarget: Record<string, { to: ArtworkStatus; from: ArtworkStatus[] }> = {
  APPROVE: { to: 'APPROVED', from: ['PENDING_REVIEW', 'REJECTED', 'SUSPENDED', 'DRAFT'] },
  REJECT: { to: 'REJECTED', from: ['PENDING_REVIEW', 'APPROVED', 'DRAFT'] },
  SUSPEND: { to: 'SUSPENDED', from: ['APPROVED', 'SOLD_OUT', 'PENDING_REVIEW'] },
  RESTORE: { to: 'APPROVED', from: ['SUSPENDED', 'ARCHIVED', 'REJECTED'] },
  ARCHIVE: { to: 'ARCHIVED', from: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'SOLD_OUT'] },
};

export const adminRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/admin/dashboard',
    roles: ADMIN,
    handler: async () => {
      const liveOrder = { order: { status: { not: 'CANCELLED' as OrderStatus } } };
      const [artists, pendingArtists, customers, artworks, publishedArtworks, pendingArtworks, orders, customRequests, openReports, sales, payouts, recentOrders, pendingArtistRows, pendingArtworkRows] =
        await Promise.all([
          prisma.artist.count(),
          prisma.artist.count({ where: { status: 'PENDING_APPROVAL' } }),
          prisma.user.count({ where: { roles: { some: { role: { name: 'CUSTOMER' } } }, artist: null } }),
          prisma.artwork.count({ where: { status: { not: 'ARCHIVED' } } }),
          prisma.artwork.count({ where: { status: { in: ['APPROVED', 'SOLD_OUT'] } } }),
          prisma.artwork.count({ where: { status: 'PENDING_REVIEW' } }),
          prisma.order.count(),
          prisma.customArtRequest.count(),
          prisma.report.count({ where: { status: { in: ['OPEN', 'REVIEWING'] } } }),
          prisma.orderItem.aggregate({ where: liveOrder, _sum: { lineTotal: true, commissionAmount: true } }),
          prisma.settlement.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
          prisma.order.findMany({ orderBy: { placedAt: 'desc' }, take: 8, include: { items: { select: { quantity: true, imageSnapshot: true } }, customer: { select: { fullName: true } } } }),
          prisma.artist.findMany({ where: { status: 'PENDING_APPROVAL' }, orderBy: { createdAt: 'asc' }, take: 8, select: { ...artistMiniSelect, type: true, createdAt: true, user: { select: { email: true } } } }),
          prisma.artwork.findMany({ where: { status: 'PENDING_REVIEW' }, orderBy: { updatedAt: 'asc' }, take: 8, select: artworkCardSelect }),
        ]);
      return ok({
        counts: { artists, pendingArtists, customers, artworks, publishedArtworks, pendingArtworks, orders, customRequests, openReports },
        revenue: { gross: money(sales._sum.lineTotal) ?? 0, commission: money(sales._sum.commissionAmount) ?? 0, payouts: money(payouts._sum.amount) ?? 0 },
        recentOrders: recentOrders.map((o) => ({ ...orderSummary(o), customer: o.customer })),
        pendingArtists: pendingArtistRows,
        pendingArtworks: pendingArtworkRows.map(toArtworkCard),
      });
    },
  },

  // ───────────── Users ─────────────
  {
    method: 'GET',
    path: '/admin/users',
    roles: ADMIN,
    handler: async (ctx) => {
      const q = parse(pagination.extend({ q: z.string().trim().max(100).optional(), role: z.enum(['ADMIN', 'ARTIST', 'CUSTOMER']).optional(), status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional() }), ctx.query);
      const where: Prisma.UserWhereInput = {
        ...(q.q ? { OR: [{ email: { contains: q.q } }, { fullName: { contains: q.q } }, { phone: { contains: q.q } }] } : {}),
        ...(q.role ? { roles: { some: { role: { name: q.role } } } } : {}),
        ...(q.status ? { status: q.status } : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
          select: { id: true, email: true, fullName: true, phone: true, status: true, createdAt: true, lastLoginAt: true, avatarUrl: true, roles: { select: { role: { select: { name: true } } } }, artist: { select: { id: true, displayName: true, status: true, slug: true } }, _count: { select: { orders: true } } },
        }),
      ]);
      return ok(
        rows.map(({ roles, _count, ...u }) => ({ ...u, roles: roles.map((r) => r.role.name), orderCount: _count.orders })),
        pageMeta(q.page, q.pageSize, total),
      );
    },
  },
  {
    method: 'PATCH',
    path: '/admin/users/:id/status',
    roles: ADMIN,
    handler: async (ctx) => {
      const input = parse(z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']), reason: z.string().trim().max(500).optional() }), ctx.body);
      if (ctx.params.id === ctx.user!.id) throw badRequest('You cannot change your own status');
      const user = await prisma.user.findUnique({ where: { id: ctx.params.id } });
      if (!user) throw notFound('User');
      if (user.status === 'DELETED') throw badRequest('Deleted accounts cannot be reactivated');
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: user.id }, data: { status: input.status as UserStatus } });
        if (input.status === 'SUSPENDED') await tx.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
      });
      await audit(ctx.user, `USER_${input.status}`, 'User', user.id, { from: user.status, reason: input.reason ?? null }, { ip: ctx.ip });
      return ok({ id: user.id, status: input.status });
    },
  },

  // ───────────── Artists ─────────────
  {
    method: 'GET',
    path: '/admin/artists',
    roles: ADMIN,
    handler: async (ctx) => {
      const q = parse(pagination.extend({ q: z.string().trim().max(100).optional(), status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED', 'INACTIVE']).optional() }), ctx.query);
      const where: Prisma.ArtistWhereInput = {
        ...(q.status ? { status: q.status } : {}),
        ...(q.q ? { OR: [{ displayName: { contains: q.q } }, { user: { email: { contains: q.q } } }, { user: { fullName: { contains: q.q } } }] } : {}),
      };
      const [total, rows, rules] = await Promise.all([
        prisma.artist.count({ where }),
        prisma.artist.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
          select: { ...artistMiniSelect, type: true, status: true, isFeatured: true, followerCount: true, createdAt: true, acceptsCustomArt: true, user: { select: { id: true, email: true, fullName: true, phone: true, status: true } }, address: { select: { city: true, country: true } }, _count: { select: { artworks: true, customRequests: true } } },
        }),
        prisma.commissionRule.findMany({ where: { scope: 'ARTIST', isActive: true } }),
      ]);
      return ok(
        rows.map(({ _count, ...a }) => ({ ...a, artworkCount: _count.artworks, customRequestCount: _count.customRequests, commissionPercentage: money(rules.find((r) => r.targetId === a.id)?.percentage) })),
        pageMeta(q.page, q.pageSize, total),
      );
    },
  },
  {
    method: 'GET',
    path: '/admin/artists/:id',
    roles: ADMIN,
    handler: async (ctx) => {
      const a = await prisma.artist.findUnique({
        where: { id: ctx.params.id },
        include: {
          user: { select: { id: true, email: true, fullName: true, phone: true, status: true, createdAt: true, lastLoginAt: true } },
          profile: { include: { primaryCategory: { select: { id: true, name: true } } } },
          address: true,
          documents: true,
          approvals: { orderBy: { createdAt: 'desc' } },
          gallery: { select: { id: true, name: true, slug: true } },
          styles: { select: { id: true, name: true } },
          mediums: { select: { id: true, name: true } },
          _count: { select: { artworks: true, customRequests: true, orderItems: true, followers: true } },
        },
      });
      if (!a) throw notFound('Artist');
      const [sales, rule] = await Promise.all([
        prisma.orderItem.aggregate({ where: { artistId: a.id, order: { status: { not: 'CANCELLED' } } }, _sum: { lineTotal: true, artistAmount: true } }),
        prisma.commissionRule.findFirst({ where: { scope: 'ARTIST', targetId: a.id } }),
      ]);
      return ok({
        ...a,
        customArtBasePrice: money(a.customArtBasePrice),
        ratingAverage: money(a.ratingAverage),
        documents: a.documents.map((d) => ({ id: d.id, kind: d.kind, title: d.title, createdAt: d.createdAt, url: createSignedFileUrl(d.storageKey, ctx.user!.id) })),
        stats: { grossSales: money(sales._sum.lineTotal) ?? 0, artistEarnings: money(sales._sum.artistAmount) ?? 0, ...a._count },
        commissionPercentage: money(rule?.percentage),
      });
    },
  },
  {
    method: 'PATCH',
    path: '/admin/artists/:id/status',
    roles: ADMIN,
    handler: async (ctx) => {
      const input = parse(z.object({ status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED', 'INACTIVE']), reason: z.string().trim().max(1000).optional() }), ctx.body);
      if (['REJECTED', 'SUSPENDED'].includes(input.status) && !input.reason) throw badRequest('A reason is required');
      const artist = await prisma.artist.findUnique({ where: { id: ctx.params.id } });
      if (!artist) throw notFound('Artist');
      if (artist.status === input.status) throw conflict(`Artist is already ${input.status}`);
      await prisma.$transaction(async (tx) => {
        await tx.artist.update({ where: { id: artist.id }, data: { status: input.status as ArtistStatus, ...(input.status !== 'APPROVED' ? { isFeatured: false } : {}) } });
        await tx.artistApproval.create({ data: { artistId: artist.id, adminId: ctx.user!.id, fromStatus: artist.status, toStatus: input.status as ArtistStatus, reason: input.reason } });
        const messages: Record<string, string> = {
          APPROVED: 'Your artist account has been approved. You can now publish artwork!',
          REJECTED: `Your artist application was not approved. ${input.reason ?? ''}`,
          SUSPENDED: `Your artist account has been suspended. ${input.reason ?? ''}`,
          INACTIVE: 'Your artist account has been marked inactive.',
          PENDING_APPROVAL: 'Your artist account is pending review again.',
        };
        await notify(artist.userId, 'ARTIST_STATUS', `Artist account ${input.status.toLowerCase().replace('_', ' ')}`, messages[input.status], '/seller', tx);
      });
      await audit(ctx.user, `ARTIST_${input.status}`, 'Artist', artist.id, { from: artist.status, reason: input.reason ?? null }, { ip: ctx.ip });
      return ok({ id: artist.id, status: input.status });
    },
  },
  {
    method: 'PATCH',
    path: '/admin/artists/:id/featured',
    roles: ADMIN,
    handler: async (ctx) => {
      const { isFeatured } = parse(z.object({ isFeatured: z.boolean() }), ctx.body);
      const artist = await prisma.artist.findUnique({ where: { id: ctx.params.id } });
      if (!artist) throw notFound('Artist');
      if (isFeatured && artist.status !== 'APPROVED') throw conflict('Only approved artists can be featured');
      await prisma.$transaction([
        prisma.artist.update({ where: { id: artist.id }, data: { isFeatured } }),
        isFeatured
          ? prisma.featuredArtist.upsert({ where: { artistId_placement: { artistId: artist.id, placement: 'HOME' } }, update: {}, create: { artistId: artist.id } })
          : prisma.featuredArtist.deleteMany({ where: { artistId: artist.id } }),
      ]);
      await audit(ctx.user, isFeatured ? 'ARTIST_FEATURED' : 'ARTIST_UNFEATURED', 'Artist', artist.id, undefined, { ip: ctx.ip });
      return ok({ id: artist.id, isFeatured });
    },
  },

  // ───────────── Artwork moderation ─────────────
  {
    method: 'GET',
    path: '/admin/artworks',
    roles: ADMIN,
    handler: async (ctx) => {
      const q = parse(pagination.extend({ q: z.string().trim().max(100).optional(), status: z.string().max(30).optional(), artistId: z.string().max(40).optional() }), ctx.query);
      const where: Prisma.ArtworkWhereInput = {
        ...(q.status ? { status: q.status as ArtworkStatus } : {}),
        ...(q.artistId ? { artistId: q.artistId } : {}),
        ...(q.q ? { OR: [{ title: { contains: q.q } }, { sku: { contains: q.q } }, { artist: { displayName: { contains: q.q } } }] } : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.artwork.count({ where }),
        prisma.artwork.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
          select: { ...artworkCardSelect, sku: true, description: true, createdAt: true, updatedAt: true, publishedAt: true, viewCount: true, salesCount: true, approvals: { orderBy: { createdAt: 'desc' }, take: 1, select: { toStatus: true, reason: true, createdAt: true } }, _count: { select: { images: true } } },
        }),
      ]);
      return ok(
        rows.map((r) => ({
          ...toArtworkCard(r),
          sku: r.sku,
          description: r.description,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          publishedAt: r.publishedAt,
          viewCount: r.viewCount,
          salesCount: r.salesCount,
          imageCount: r._count.images,
          lastModeration: r.approvals[0] ?? null,
        })),
        pageMeta(q.page, q.pageSize, total),
      );
    },
  },
  {
    method: 'PATCH',
    path: '/admin/artworks/:id/moderate',
    roles: ADMIN,
    handler: async (ctx) => {
      const input = parse(z.object({ action: z.enum(['APPROVE', 'REJECT', 'SUSPEND', 'RESTORE', 'ARCHIVE']), reason: z.string().trim().max(1000).optional() }), ctx.body);
      if (['REJECT', 'SUSPEND'].includes(input.action) && !input.reason) throw badRequest('A reason is required');
      const artwork = await prisma.artwork.findUnique({ where: { id: ctx.params.id }, include: { artist: { select: { userId: true, displayName: true, status: true } }, _count: { select: { images: true } } } });
      if (!artwork) throw notFound('Artwork');
      const rule = moderationTarget[input.action];
      if (!rule.from.includes(artwork.status)) throw conflict(`Cannot ${input.action.toLowerCase()} an artwork that is ${artwork.status}`);
      if (rule.to === 'APPROVED' && artwork._count.images === 0) throw conflict('Artwork has no images');
      const firstPublish = rule.to === 'APPROVED' && !artwork.publishedAt;

      await prisma.$transaction(async (tx) => {
        await tx.artwork.update({ where: { id: artwork.id }, data: { status: rule.to, ...(firstPublish ? { publishedAt: new Date() } : {}), ...(rule.to !== 'APPROVED' ? { isFeatured: false } : {}) } });
        if (rule.to !== 'APPROVED') await tx.featuredArtwork.deleteMany({ where: { artworkId: artwork.id } });
        await tx.artworkApproval.create({ data: { artworkId: artwork.id, actorId: ctx.user!.id, fromStatus: artwork.status, toStatus: rule.to, reason: input.reason } });
        await notify(artwork.artist.userId, 'ARTWORK_MODERATED', `"${artwork.title}" ${rule.to.toLowerCase().replace('_', ' ')}`, input.reason, '/seller/artworks', tx);
        if (firstPublish && artwork.artist.status === 'APPROVED') {
          const followers = await tx.artistFollow.findMany({ where: { artistId: artwork.artistId }, select: { userId: true } });
          if (followers.length) {
            await tx.notification.createMany({
              data: followers.map((f) => ({ userId: f.userId, type: 'NEW_ARTWORK', title: `New artwork by ${artwork.artist.displayName}`, body: artwork.title, link: `/artworks/${artwork.slug}` })),
            });
          }
        }
      });
      await audit(ctx.user, `ARTWORK_${input.action}`, 'Artwork', artwork.id, { from: artwork.status, to: rule.to, reason: input.reason ?? null }, { ip: ctx.ip });
      return ok({ id: artwork.id, status: rule.to });
    },
  },
  {
    method: 'PATCH',
    path: '/admin/artworks/:id/featured',
    roles: ADMIN,
    handler: async (ctx) => {
      const { isFeatured } = parse(z.object({ isFeatured: z.boolean() }), ctx.body);
      const artwork = await prisma.artwork.findUnique({ where: { id: ctx.params.id }, include: { artist: { select: { userId: true } } } });
      if (!artwork) throw notFound('Artwork');
      if (isFeatured && !['APPROVED', 'SOLD_OUT'].includes(artwork.status)) throw conflict('Only published artwork can be featured');
      await prisma.$transaction(async (tx) => {
        await tx.artwork.update({ where: { id: artwork.id }, data: { isFeatured } });
        if (isFeatured) {
          await tx.featuredArtwork.upsert({ where: { artworkId_placement: { artworkId: artwork.id, placement: 'HOME' } }, update: {}, create: { artworkId: artwork.id } });
          await notify(artwork.artist.userId, 'ARTWORK_FEATURED', `"${artwork.title}" is now featured`, 'Your artwork is featured on the homepage.', `/artworks/${artwork.slug}`, tx);
        } else {
          await tx.featuredArtwork.deleteMany({ where: { artworkId: artwork.id } });
        }
      });
      await audit(ctx.user, isFeatured ? 'ARTWORK_FEATURED' : 'ARTWORK_UNFEATURED', 'Artwork', artwork.id, undefined, { ip: ctx.ip });
      return ok({ id: artwork.id, isFeatured });
    },
  },

  // ───────────── Orders ─────────────
  {
    method: 'GET',
    path: '/admin/orders',
    roles: ADMIN,
    handler: async (ctx) => {
      const q = parse(pagination.extend({ q: z.string().trim().max(100).optional(), status: z.string().max(30).optional(), paymentStatus: z.string().max(30).optional() }), ctx.query);
      const where: Prisma.OrderWhereInput = {
        ...(q.status ? { status: q.status as OrderStatus } : {}),
        ...(q.paymentStatus ? { paymentStatus: q.paymentStatus as PaymentStatus } : {}),
        ...(q.q ? { OR: [{ orderNumber: { contains: q.q } }, { customer: { email: { contains: q.q } } }, { customer: { fullName: { contains: q.q } } }] } : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({ where, orderBy: { placedAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize, include: { items: { select: { quantity: true, imageSnapshot: true } }, customer: { select: { id: true, fullName: true, email: true } } } }),
      ]);
      return ok(
        rows.map((o) => ({ ...orderSummary(o), customer: o.customer })),
        pageMeta(q.page, q.pageSize, total),
      );
    },
  },
  {
    method: 'GET',
    path: '/admin/orders/:id',
    roles: ADMIN,
    handler: async (ctx) => {
      const detail = await loadOrderDetail(ctx.params.id, { includeCustomer: true });
      const commissions = await prisma.commission.findMany({ where: { orderItem: { orderId: ctx.params.id } } });
      return ok({ ...detail, commissions: commissions.map((c) => ({ orderItemId: c.orderItemId, scope: c.ruleScope, percentage: money(c.percentage), amount: money(c.amount), artistAmount: money(c.artistAmount) })) });
    },
  },
  {
    method: 'PATCH',
    path: '/admin/orders/:id/status',
    roles: ADMIN,
    handler: async (ctx) => {
      const { status, reason } = parse(z.object({ status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'COMPLETED', 'CANCELLED']), reason: z.string().trim().max(500).optional() }), ctx.body);
      const order = await prisma.order.findUnique({ where: { id: ctx.params.id } });
      if (!order) throw notFound('Order');
      if (order.status === 'CANCELLED') throw conflict('Cancelled orders cannot be reopened');
      if (status === 'CANCELLED') await cancelOrder(order.id);
      else {
        await prisma.order.update({ where: { id: order.id }, data: { status } });
        await notify(order.customerId, 'ORDER_UPDATE', `Order ${order.orderNumber}: ${status.toLowerCase().replace('_', ' ')}`, reason, `/account/orders/${order.id}`);
      }
      await audit(ctx.user, 'ORDER_STATUS_OVERRIDE', 'Order', order.id, { from: order.status, to: status, reason: reason ?? null }, { ip: ctx.ip });
      return ok(await loadOrderDetail(order.id, { includeCustomer: true }));
    },
  },

  // ───────────── Reviews ─────────────
  {
    method: 'GET',
    path: '/admin/reviews',
    roles: ADMIN,
    handler: async (ctx) => {
      const q = parse(pagination.extend({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(), kind: z.enum(['artwork', 'artist']).optional() }), ctx.query);
      const where = q.status ? { status: q.status as ReviewStatus } : {};
      const take = q.page * q.pageSize;
      const [artworkTotal, artistTotal, artworkRows, artistRows] = await Promise.all([
        q.kind === 'artist' ? 0 : prisma.artworkReview.count({ where }),
        q.kind === 'artwork' ? 0 : prisma.artistReview.count({ where }),
        q.kind === 'artist' ? [] : prisma.artworkReview.findMany({ where, orderBy: { createdAt: 'desc' }, take, include: { user: { select: { fullName: true, email: true } }, artwork: { select: { id: true, title: true, slug: true } } } }),
        q.kind === 'artwork' ? [] : prisma.artistReview.findMany({ where, orderBy: { createdAt: 'desc' }, take, include: { user: { select: { fullName: true, email: true } }, artist: { select: artistMiniSelect } } }),
      ]);
      const merged = [
        ...artworkRows.map((r) => ({ kind: 'artwork' as const, id: r.id, rating: r.rating, title: r.title, body: r.body, status: r.status, verifiedPurchase: r.verifiedPurchase, createdAt: r.createdAt, user: r.user, artwork: r.artwork, artist: null })),
        ...artistRows.map((r) => ({ kind: 'artist' as const, id: r.id, rating: r.rating, title: null, body: r.body, status: r.status, verifiedPurchase: r.verifiedPurchase, createdAt: r.createdAt, user: r.user, artwork: null, artist: r.artist })),
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return ok(merged.slice((q.page - 1) * q.pageSize, take), pageMeta(q.page, q.pageSize, artworkTotal + artistTotal));
    },
  },
  {
    method: 'PATCH',
    path: '/admin/reviews/:kind/:id',
    roles: ADMIN,
    handler: async (ctx) => {
      const { status } = parse(z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']) }), ctx.body);
      const kind = ctx.params.kind;
      if (kind === 'artwork') {
        const r = await prisma.artworkReview.findUnique({ where: { id: ctx.params.id } });
        if (!r) throw notFound('Review');
        await prisma.artworkReview.update({ where: { id: r.id }, data: { status } });
        await recomputeArtworkRating(r.artworkId);
      } else if (kind === 'artist') {
        const r = await prisma.artistReview.findUnique({ where: { id: ctx.params.id } });
        if (!r) throw notFound('Review');
        await prisma.artistReview.update({ where: { id: r.id }, data: { status } });
        await recomputeArtistRating(r.artistId);
      } else throw badRequest('kind must be artwork or artist');
      await audit(ctx.user, `REVIEW_${status}`, kind === 'artwork' ? 'ArtworkReview' : 'ArtistReview', ctx.params.id, undefined, { ip: ctx.ip });
      return ok({ id: ctx.params.id, status });
    },
  },

  // ───────────── Reports ─────────────
  {
    method: 'GET',
    path: '/admin/reports',
    roles: ADMIN,
    handler: async (ctx) => {
      const q = parse(pagination.extend({ status: z.enum(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED']).optional() }), ctx.query);
      const where = q.status ? { status: q.status as ReportStatus } : {};
      const [total, rows] = await Promise.all([
        prisma.report.count({ where }),
        prisma.report.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize, include: { reporter: { select: { id: true, fullName: true, email: true } } } }),
      ]);
      // Resolve a human label for each target.
      const ids = (t: string) => rows.filter((r) => r.targetType === t).map((r) => r.targetId);
      const [artworks, users, artists] = await Promise.all([
        prisma.artwork.findMany({ where: { id: { in: ids('ARTWORK') } }, select: { id: true, title: true, slug: true, status: true } }),
        prisma.user.findMany({ where: { id: { in: ids('USER') } }, select: { id: true, fullName: true, email: true, status: true } }),
        prisma.artist.findMany({ where: { id: { in: ids('ARTIST') } }, select: { id: true, displayName: true, slug: true, status: true } }),
      ]);
      const target = (t: string, id: string) =>
        t === 'ARTWORK' ? artworks.find((a) => a.id === id) : t === 'USER' ? users.find((u) => u.id === id) : t === 'ARTIST' ? artists.find((a) => a.id === id) : null;
      return ok(
        rows.map((r) => ({ ...r, target: target(r.targetType, r.targetId) ?? null })),
        pageMeta(q.page, q.pageSize, total),
      );
    },
  },
  {
    method: 'PATCH',
    path: '/admin/reports/:id',
    roles: ADMIN,
    handler: async (ctx) => {
      const input = parse(z.object({ status: z.enum(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED']), resolution: z.string().trim().max(1000).optional() }), ctx.body);
      const report = await prisma.report.findUnique({ where: { id: ctx.params.id } });
      if (!report) throw notFound('Report');
      const updated = await prisma.report.update({ where: { id: report.id }, data: { status: input.status, resolution: input.resolution, resolvedById: ['RESOLVED', 'DISMISSED'].includes(input.status) ? ctx.user!.id : null } });
      if (['RESOLVED', 'DISMISSED'].includes(input.status)) {
        await notify(report.reporterId, 'REPORT_UPDATE', `Your report was ${input.status.toLowerCase()}`, input.resolution);
      }
      await audit(ctx.user, `REPORT_${input.status}`, 'Report', report.id, { resolution: input.resolution ?? null }, { ip: ctx.ip });
      return ok(updated);
    },
  },

  // ───────────── Banners ─────────────
  {
    method: 'GET',
    path: '/admin/banners',
    roles: ADMIN,
    handler: async () => ok(await prisma.banner.findMany({ orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }] })),
  },
  {
    method: 'POST',
    path: '/admin/banners',
    roles: ADMIN,
    handler: async (ctx) => {
      const input = parse(bannerSchema, ctx.body);
      const banner = await prisma.banner.create({ data: { ...input, imageUrl: input.imageUrl ?? '' } });
      await audit(ctx.user, 'BANNER_CREATED', 'Banner', banner.id, { title: banner.title }, { ip: ctx.ip });
      return created(banner);
    },
  },
  {
    method: 'PATCH',
    path: '/admin/banners/:id',
    roles: ADMIN,
    handler: async (ctx) => {
      const input = parse(bannerPatchSchema, ctx.body);
      const banner = await prisma.banner.update({ where: { id: ctx.params.id }, data: input });
      await audit(ctx.user, 'BANNER_UPDATED', 'Banner', banner.id, input as Prisma.InputJsonValue, { ip: ctx.ip });
      return ok(banner);
    },
  },
  {
    method: 'DELETE',
    path: '/admin/banners/:id',
    roles: ADMIN,
    handler: async (ctx) => {
      await prisma.banner.delete({ where: { id: ctx.params.id } });
      await audit(ctx.user, 'BANNER_DELETED', 'Banner', ctx.params.id, undefined, { ip: ctx.ip });
      return ok({ deleted: true });
    },
  },
  {
    method: 'POST',
    path: '/admin/banners/:id/image',
    roles: ADMIN,
    rateLimit: 'upload',
    upload: { field: 'image', maxCount: 1 },
    handler: async (ctx) => {
      const banner = await prisma.banner.findUnique({ where: { id: ctx.params.id } });
      if (!banner) throw notFound('Banner');
      if (!ctx.files[0]) throw badRequest('Upload an image');
      const img = await processAndStoreImage(ctx.files[0], 'site', { minWidth: 800, minHeight: 300, maxDimension: 2400, thumbnail: false });
      const updated = await prisma.banner.update({ where: { id: banner.id }, data: { imageUrl: img.main.url! } });
      await audit(ctx.user, 'BANNER_IMAGE_UPDATED', 'Banner', banner.id, undefined, { ip: ctx.ip });
      return ok(updated);
    },
  },

  // ───────────── Settings & audit ─────────────
  {
    method: 'GET',
    path: '/admin/settings',
    roles: ADMIN,
    handler: async () => ok(await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } })),
  },
  {
    method: 'PUT',
    path: '/admin/settings/:key',
    roles: ADMIN,
    handler: async (ctx) => {
      const key = ctx.params.key;
      if (!/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+){0,4}$/.test(key) || key.length > 80) throw badRequest('Invalid setting key');
      // The website config has its own validated endpoint; never let it be written unchecked here.
      if (key === SITE_CONFIG_KEY) throw badRequest('Use PUT /admin/site-config to change the website configuration');
      const { value } = parse(z.object({ value: z.union([z.string().max(5000), z.number(), z.boolean(), z.record(z.string(), z.unknown()), z.array(z.unknown())]) }), ctx.body);
      const before = await prisma.systemSetting.findUnique({ where: { key } });
      const row = await prisma.systemSetting.upsert({ where: { key }, update: { value: value as Prisma.InputJsonValue }, create: { key, value: value as Prisma.InputJsonValue } });
      await audit(ctx.user, 'SETTING_UPDATED', 'SystemSetting', key, { before: (before?.value ?? null) as Prisma.InputJsonValue, after: value as Prisma.InputJsonValue }, { ip: ctx.ip });
      return ok(row);
    },
  },
  {
    method: 'GET',
    path: '/admin/audit-logs',
    roles: ADMIN,
    handler: async (ctx) => {
      const q = parse(pagination.extend({ pageSize: z.coerce.number().int().min(1).max(100).default(50), entityType: z.string().max(60).optional(), actorId: z.string().max(40).optional(), action: z.string().max(80).optional(), entityId: z.string().max(80).optional() }), ctx.query);
      const where: Prisma.AuditLogWhereInput = {
        ...(q.entityType ? { entityType: q.entityType } : {}),
        ...(q.actorId ? { actorId: q.actorId } : {}),
        ...(q.entityId ? { entityId: q.entityId } : {}),
        ...(q.action ? { action: { contains: q.action } } : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize, include: { actor: { select: { id: true, fullName: true, email: true } } } }),
      ]);
      return ok(rows, pageMeta(q.page, q.pageSize, total));
    },
  },
];

const bannerPatchSchema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  subtitle: z.string().trim().max(300).optional(),
  imageUrl: safeLink.optional(),
  linkUrl: safeLink.optional(),
  placement: z.string().trim().max(40).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});

const bannerSchema = bannerPatchSchema.extend({
  title: z.string().trim().min(2).max(150),
  placement: z.string().trim().max(40).default('HOME_HERO'),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

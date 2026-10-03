import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { audit } from '../../shared/audit.js';
import { ok, type RouteDef } from '../../shared/http.js';
import { money } from '../../shared/serializers.js';
import { parse } from '../../shared/validation.js';

const filterSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  artistId: z.string().max(40).optional(),
  categoryId: z.string().max(40).optional(),
});

type Filters = { from: Date; to: Date; artistId?: string; categoryId?: string };

function resolveFilters(query: unknown): Filters {
  const f = parse(filterSchema, query);
  const to = f.to ? new Date(f.to) : new Date();
  if (f.to) to.setHours(23, 59, 59, 999);
  const from = f.from ?? new Date(to.getTime() - 29 * 86_400_000);
  if (!f.from) from.setHours(0, 0, 0, 0);
  return { from, to, artistId: f.artistId, categoryId: f.categoryId };
}

/** Parameterised SQL fragments only — user input is never concatenated into SQL. */
function itemFilterSql(f: Filters) {
  return Prisma.sql`
    o.status <> 'CANCELLED' AND o.placedAt BETWEEN ${f.from} AND ${f.to}
    ${f.artistId ? Prisma.sql`AND oi.artistId = ${f.artistId}` : Prisma.empty}
    ${f.categoryId ? Prisma.sql`AND a.categoryId = ${f.categoryId}` : Prisma.empty}`;
}

function itemWhere(f: Filters): Prisma.OrderItemWhereInput {
  return {
    order: { status: { not: 'CANCELLED' }, placedAt: { gte: f.from, lte: f.to } },
    ...(f.artistId ? { artistId: f.artistId } : {}),
    ...(f.categoryId ? { artwork: { categoryId: f.categoryId } } : {}),
  };
}

const n = (v: unknown) => Number(v ?? 0);

export async function overview(f: Filters) {
  const where = itemWhere(f);
  const [artists, customers, artworks, publishedArtworks, pendingArtworks, orders, sums, payouts, customRequests, completedCustomArt] = await Promise.all([
    prisma.artist.count({ where: { status: 'APPROVED' } }),
    prisma.user.count({ where: { roles: { some: { role: { name: 'CUSTOMER' } } }, artist: null } }),
    prisma.artwork.count({ where: { status: { not: 'ARCHIVED' }, ...(f.artistId ? { artistId: f.artistId } : {}), ...(f.categoryId ? { categoryId: f.categoryId } : {}) } }),
    prisma.artwork.count({ where: { status: { in: ['APPROVED', 'SOLD_OUT'] }, ...(f.artistId ? { artistId: f.artistId } : {}), ...(f.categoryId ? { categoryId: f.categoryId } : {}) } }),
    prisma.artwork.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.order.count({ where: { status: { not: 'CANCELLED' }, placedAt: { gte: f.from, lte: f.to }, items: { some: where } } }),
    prisma.orderItem.aggregate({ where, _sum: { lineTotal: true, commissionAmount: true, artistAmount: true } }),
    prisma.settlement.aggregate({ where: { status: 'COMPLETED', completedAt: { gte: f.from, lte: f.to }, ...(f.artistId ? { artistId: f.artistId } : {}) }, _sum: { amount: true } }),
    prisma.customArtRequest.count({ where: { createdAt: { gte: f.from, lte: f.to }, ...(f.artistId ? { artistId: f.artistId } : {}) } }),
    prisma.customArtRequest.count({ where: { status: 'COMPLETED', updatedAt: { gte: f.from, lte: f.to }, ...(f.artistId ? { artistId: f.artistId } : {}) } }),
  ]);

  const filter = itemFilterSql(f);
  const [byDay, topStyles, topCategories, topArtists, trending, customStyles] = await Promise.all([
    prisma.$queryRaw<Array<{ date: string; gross: unknown; commission: unknown; orders: bigint }>>`
      SELECT DATE_FORMAT(o.placedAt, '%Y-%m-%d') AS date, SUM(oi.lineTotal) AS gross, SUM(oi.commissionAmount) AS commission, COUNT(DISTINCT o.id) AS orders
      FROM OrderItem oi JOIN \`Order\` o ON o.id = oi.orderId LEFT JOIN Artwork a ON a.id = oi.artworkId
      WHERE ${filter}
      GROUP BY date ORDER BY date`,
    prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
      SELECT s.name AS name, SUM(oi.quantity) AS count
      FROM OrderItem oi JOIN \`Order\` o ON o.id = oi.orderId JOIN Artwork a ON a.id = oi.artworkId JOIN ArtworkStyle s ON s.id = a.styleId
      WHERE ${filter}
      GROUP BY s.name ORDER BY count DESC LIMIT 10`,
    prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
      SELECT c.name AS name, SUM(oi.quantity) AS count
      FROM OrderItem oi JOIN \`Order\` o ON o.id = oi.orderId JOIN Artwork a ON a.id = oi.artworkId JOIN ArtworkCategory c ON c.id = a.categoryId
      WHERE ${filter}
      GROUP BY c.name ORDER BY count DESC LIMIT 10`,
    prisma.$queryRaw<Array<{ id: string; displayName: string; gross: unknown }>>`
      SELECT ar.id AS id, ar.displayName AS displayName, SUM(oi.lineTotal) AS gross
      FROM OrderItem oi JOIN \`Order\` o ON o.id = oi.orderId JOIN Artist ar ON ar.id = oi.artistId LEFT JOIN Artwork a ON a.id = oi.artworkId
      WHERE ${filter}
      GROUP BY ar.id, ar.displayName ORDER BY gross DESC LIMIT 10`,
    prisma.artwork.findMany({
      where: { status: { in: ['APPROVED', 'SOLD_OUT'] }, ...(f.artistId ? { artistId: f.artistId } : {}), ...(f.categoryId ? { categoryId: f.categoryId } : {}) },
      orderBy: [{ salesCount: 'desc' }, { viewCount: 'desc' }],
      take: 10,
      select: { id: true, slug: true, title: true, viewCount: true, salesCount: true, wishlistCount: true },
    }),
    prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
      SELECT s.name AS name, COUNT(*) AS count
      FROM CustomArtRequest r JOIN ArtworkStyle s ON s.id = r.selectedStyleId
      WHERE r.createdAt BETWEEN ${f.from} AND ${f.to}
      ${f.artistId ? Prisma.sql`AND r.artistId = ${f.artistId}` : Prisma.empty}
      GROUP BY s.name ORDER BY count DESC LIMIT 10`,
  ]);

  return {
    range: { from: f.from, to: f.to },
    totals: {
      artists,
      customers,
      artworks,
      publishedArtworks,
      pendingArtworks,
      orders,
      grossSales: money(sums._sum.lineTotal) ?? 0,
      platformCommission: money(sums._sum.commissionAmount) ?? 0,
      artistEarnings: money(sums._sum.artistAmount) ?? 0,
      artistPayouts: money(payouts._sum.amount) ?? 0,
      customRequests,
      completedCustomArt,
    },
    salesByDay: byDay.map((d) => ({ date: d.date, gross: n(d.gross), commission: n(d.commission), orders: n(d.orders) })),
    topStyles: topStyles.map((r) => ({ name: r.name, count: n(r.count) })),
    topCategories: topCategories.map((r) => ({ name: r.name, count: n(r.count) })),
    topArtists: topArtists.map((r) => ({ id: r.id, displayName: r.displayName, gross: n(r.gross) })),
    trendingArtworks: trending.map((a) => ({ id: a.id, slug: a.slug, title: a.title, views: a.viewCount, sales: a.salesCount, wishlists: a.wishlistCount })),
    topCustomStyles: customStyles.map((r) => ({ name: r.name, count: n(r.count) })),
  };
}

/** RFC 4180 escaping + spreadsheet formula-injection neutralisation. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

async function exportRows(type: string, f: Filters): Promise<{ headers: string[]; rows: unknown[][] }> {
  if (type === 'orders') {
    const orders = await prisma.order.findMany({
      where: { placedAt: { gte: f.from, lte: f.to }, ...(f.artistId || f.categoryId ? { items: { some: itemWhere(f) } } : {}) },
      include: { customer: { select: { fullName: true, email: true } }, _count: { select: { items: true } } },
      orderBy: { placedAt: 'asc' },
    });
    return {
      headers: ['Order', 'Placed at', 'Customer', 'Email', 'Status', 'Payment status', 'Method', 'Items', 'Subtotal', 'Shipping', 'Total', 'Currency'],
      rows: orders.map((o) => [o.orderNumber, o.placedAt, o.customer.fullName, o.customer.email, o.status, o.paymentStatus, o.paymentMethod, o._count.items, money(o.subtotal), money(o.shippingFee), money(o.total), o.currency]),
    };
  }
  if (type === 'artists') {
    const artists = await prisma.artist.findMany({
      where: f.artistId ? { id: f.artistId } : {},
      include: { user: { select: { email: true } }, _count: { select: { artworks: true, followers: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const sales = await prisma.orderItem.groupBy({ by: ['artistId'], where: itemWhere(f), _sum: { lineTotal: true, commissionAmount: true, artistAmount: true } });
    return {
      headers: ['Artist', 'Email', 'Status', 'Type', 'Artworks', 'Followers', 'Gross sales', 'Commission', 'Artist earnings', 'Joined'],
      rows: artists.map((a) => {
        const s = sales.find((x) => x.artistId === a.id)?._sum;
        return [a.displayName, a.user.email, a.status, a.type, a._count.artworks, a._count.followers, money(s?.lineTotal) ?? 0, money(s?.commissionAmount) ?? 0, money(s?.artistAmount) ?? 0, a.createdAt];
      }),
    };
  }
  if (type === 'custom-art') {
    const reqs = await prisma.customArtRequest.findMany({
      where: { createdAt: { gte: f.from, lte: f.to }, ...(f.artistId ? { artistId: f.artistId } : {}) },
      include: { artist: { select: { displayName: true } }, customer: { select: { fullName: true } }, selectedStyle: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return {
      headers: ['Request', 'Created', 'Customer', 'Artist', 'Style', 'Format', 'Status', 'Budget', 'Quoted', 'Revisions'],
      rows: reqs.map((r) => [r.requestNumber, r.createdAt, r.customer.fullName, r.artist.displayName, r.selectedStyle?.name, r.requestedFormat, r.status, money(r.budget), money(r.quotedPrice), r.revisionCount]),
    };
  }
  const items = await prisma.orderItem.findMany({
    where: itemWhere(f),
    include: { order: { select: { orderNumber: true, placedAt: true, paymentStatus: true } }, artist: { select: { displayName: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return {
    headers: ['Order', 'Placed at', 'Item', 'Artist', 'Format', 'Qty', 'Unit price', 'Line total', 'Commission %', 'Commission', 'Artist amount', 'Payment status'],
    rows: items.map((i) => [i.order.orderNumber, i.order.placedAt, i.titleSnapshot, i.artist.displayName, i.format, i.quantity, money(i.unitPrice), money(i.lineTotal), money(i.commissionRate), money(i.commissionAmount), money(i.artistAmount), i.order.paymentStatus]),
  };
}

export const analyticsRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/analytics/overview',
    roles: ['ADMIN'],
    handler: async (ctx) => ok(await overview(resolveFilters(ctx.query))),
  },
  {
    method: 'GET',
    path: '/analytics/export',
    roles: ['ADMIN'],
    handler: async (ctx) => {
      const { type } = parse(z.object({ type: z.enum(['sales', 'orders', 'artists', 'custom-art']).default('sales') }), ctx.query);
      const f = resolveFilters(ctx.query);
      const { headers, rows } = await exportRows(type, f);
      await audit(ctx.user, 'ANALYTICS_EXPORTED', 'Analytics', type, { rows: rows.length }, { ip: ctx.ip });
      const stamp = new Date().toISOString().slice(0, 10);
      return { status: 200, raw: { contentType: 'text/csv; charset=utf-8', body: '﻿' + toCsv(headers, rows), filename: `${type}-${stamp}.csv` } };
    },
  },
];

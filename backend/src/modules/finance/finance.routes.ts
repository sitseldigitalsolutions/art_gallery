import { Prisma, type CommissionScope, type SettlementStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { audit, notify } from '../../shared/audit.js';
import { badRequest, conflict, forbidden, notFound } from '../../shared/errors.js';
import { created, ok, type RouteDef } from '../../shared/http.js';
import { artistMiniSelect, money } from '../../shared/serializers.js';
import { pageMeta, pagination, parse } from '../../shared/validation.js';
import { fromMinor, toMinor } from '../../utils/money.js';

const sumMinor = (rows: Array<{ amount: Prisma.Decimal }>) => rows.reduce((s, r) => s + toMinor(r.amount), 0);
const rupees = (minor: number) => Number(fromMinor(minor));

export async function artistEarnings(artistId: string) {
  const entries = await prisma.artistLedger.findMany({
    where: { artistId },
    select: { type: true, status: true, amount: true, orderItem: { select: { customArtRequestId: true } } },
  });
  const live = entries.filter((e) => e.status !== 'REVERSED');
  const sales = live.filter((e) => e.type === 'SALE_CREDIT');
  const commission = live.filter((e) => e.type === 'COMMISSION_DEBIT');
  const earning = live.filter((e) => e.type !== 'SETTLEMENT_DEBIT');
  const gross = sumMinor(sales);
  const comm = -sumMinor(commission);
  return {
    grossSales: rupees(gross),
    commission: rupees(comm),
    net: rupees(gross - comm),
    pending: rupees(sumMinor(earning.filter((e) => e.status === 'PENDING'))),
    available: rupees(sumMinor(earning.filter((e) => e.status === 'AVAILABLE'))),
    settled: rupees(sumMinor(earning.filter((e) => e.status === 'SETTLED'))),
    customArtNet: rupees(sumMinor(earning.filter((e) => e.orderItem?.customArtRequestId))),
  };
}

const commissionBody = z
  .object({
    scope: z.enum(['GLOBAL', 'ARTIST', 'CATEGORY', 'ARTWORK', 'CUSTOM_ART']),
    targetId: z.string().max(40).optional().nullable(),
    percentage: z.coerce.number().min(0).max(100),
  })
  .refine((v) => (v.scope === 'GLOBAL' || v.scope === 'CUSTOM_ART' ? !v.targetId : !!v.targetId), 'targetId is required for ARTIST/CATEGORY/ARTWORK and not allowed for GLOBAL/CUSTOM_ART');

async function assertTargetExists(scope: CommissionScope, targetId: string | null | undefined) {
  if (!targetId) return;
  const exists =
    scope === 'ARTIST'
      ? await prisma.artist.count({ where: { id: targetId } })
      : scope === 'CATEGORY'
        ? await prisma.artworkCategory.count({ where: { id: targetId } })
        : await prisma.artwork.count({ where: { id: targetId } });
  if (!exists) throw badRequest(`Unknown ${scope.toLowerCase()} ${targetId}`);
}

export const financeRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/artists/me/earnings',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const artistId = ctx.user!.artistId;
      if (!artistId) throw forbidden('Artist account required');
      const since = new Date();
      since.setMonth(since.getMonth() - 11, 1);
      since.setHours(0, 0, 0, 0);
      const [totals, monthly, ledger, settlements] = await Promise.all([
        artistEarnings(artistId),
        prisma.$queryRaw<Array<{ month: string; gross: Prisma.Decimal | null; net: Prisma.Decimal | null; orders: bigint }>>`
          SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month,
                 SUM(CASE WHEN type = 'SALE_CREDIT' THEN amount ELSE 0 END) AS gross,
                 SUM(CASE WHEN type IN ('SALE_CREDIT', 'COMMISSION_DEBIT') THEN amount ELSE 0 END) AS net,
                 COUNT(DISTINCT CASE WHEN type = 'SALE_CREDIT' THEN orderItemId END) AS orders
          FROM ArtistLedger
          WHERE artistId = ${artistId} AND status <> 'REVERSED' AND createdAt >= ${since}
          GROUP BY month ORDER BY month`,
        prisma.artistLedger.findMany({ where: { artistId }, orderBy: { createdAt: 'desc' }, take: 50 }),
        prisma.settlement.findMany({ where: { artistId }, orderBy: { createdAt: 'desc' }, take: 50 }),
      ]);
      return ok({
        totals,
        monthly: monthly.map((m) => ({ month: m.month, gross: Number(m.gross ?? 0), net: Number(m.net ?? 0), orders: Number(m.orders) })),
        ledger: ledger.map((l) => ({ id: l.id, type: l.type, status: l.status, amount: money(l.amount), description: l.description, createdAt: l.createdAt })),
        settlements: settlements.map((s) => ({ id: s.id, amount: money(s.amount), status: s.status, reference: s.reference, createdAt: s.createdAt, completedAt: s.completedAt })),
      });
    },
  },

  // ───────────── Commission rules ─────────────
  {
    method: 'GET',
    path: '/admin/commissions',
    roles: ['ADMIN'],
    handler: async () => {
      const rules = await prisma.commissionRule.findMany({ orderBy: [{ scope: 'asc' }, { createdAt: 'asc' }] });
      const ids = (s: CommissionScope) => rules.filter((r) => r.scope === s && r.targetId).map((r) => r.targetId!);
      const [artists, categories, artworks] = await Promise.all([
        prisma.artist.findMany({ where: { id: { in: ids('ARTIST') } }, select: { id: true, displayName: true } }),
        prisma.artworkCategory.findMany({ where: { id: { in: ids('CATEGORY') } }, select: { id: true, name: true } }),
        prisma.artwork.findMany({ where: { id: { in: ids('ARTWORK') } }, select: { id: true, title: true } }),
      ]);
      const label = new Map<string, string>([
        ...artists.map((a) => [a.id, a.displayName] as [string, string]),
        ...categories.map((c) => [c.id, c.name] as [string, string]),
        ...artworks.map((a) => [a.id, a.title] as [string, string]),
      ]);
      return ok(rules.map((r) => ({ ...r, percentage: Number(r.percentage), targetLabel: r.targetId ? (label.get(r.targetId) ?? null) : null })));
    },
  },
  {
    method: 'POST',
    path: '/admin/commissions',
    roles: ['ADMIN'],
    handler: async (ctx) => {
      const input = parse(commissionBody, ctx.body);
      await assertTargetExists(input.scope, input.targetId);
      const existing = await prisma.commissionRule.findFirst({ where: { scope: input.scope, targetId: input.targetId ?? null } });
      if (existing) throw conflict('A rule for this scope and target already exists — edit it instead');
      const rule = await prisma.commissionRule.create({ data: { scope: input.scope, targetId: input.targetId ?? null, percentage: input.percentage } });
      await audit(ctx.user, 'COMMISSION_RULE_CREATED', 'CommissionRule', rule.id, input, { ip: ctx.ip });
      return created({ ...rule, percentage: Number(rule.percentage) });
    },
  },
  {
    method: 'PATCH',
    path: '/admin/commissions/:id',
    roles: ['ADMIN'],
    handler: async (ctx) => {
      const input = parse(z.object({ percentage: z.coerce.number().min(0).max(100).optional(), isActive: z.boolean().optional() }), ctx.body);
      const before = await prisma.commissionRule.findUnique({ where: { id: ctx.params.id } });
      if (!before) throw notFound('Commission rule');
      const rule = await prisma.commissionRule.update({ where: { id: before.id }, data: input });
      await audit(ctx.user, 'COMMISSION_RULE_UPDATED', 'CommissionRule', rule.id, { before: { percentage: Number(before.percentage), isActive: before.isActive }, after: input }, { ip: ctx.ip });
      return ok({ ...rule, percentage: Number(rule.percentage) });
    },
  },
  {
    method: 'DELETE',
    path: '/admin/commissions/:id',
    roles: ['ADMIN'],
    handler: async (ctx) => {
      const rule = await prisma.commissionRule.findUnique({ where: { id: ctx.params.id } });
      if (!rule) throw notFound('Commission rule');
      await prisma.commissionRule.delete({ where: { id: rule.id } });
      await audit(ctx.user, 'COMMISSION_RULE_DELETED', 'CommissionRule', rule.id, { scope: rule.scope, targetId: rule.targetId, percentage: Number(rule.percentage) }, { ip: ctx.ip });
      return ok({ deleted: true });
    },
  },
  {
    method: 'PATCH',
    path: '/admin/artists/:id/commission',
    roles: ['ADMIN'],
    handler: async (ctx) => {
      const { percentage } = parse(z.object({ percentage: z.coerce.number().min(0).max(100).nullable() }), ctx.body);
      const artist = await prisma.artist.findUnique({ where: { id: ctx.params.id } });
      if (!artist) throw notFound('Artist');
      const existing = await prisma.commissionRule.findFirst({ where: { scope: 'ARTIST', targetId: artist.id } });
      if (percentage === null) {
        if (existing) await prisma.commissionRule.delete({ where: { id: existing.id } });
      } else if (existing) {
        await prisma.commissionRule.update({ where: { id: existing.id }, data: { percentage, isActive: true } });
      } else {
        await prisma.commissionRule.create({ data: { scope: 'ARTIST', targetId: artist.id, percentage } });
      }
      await audit(ctx.user, 'ARTIST_COMMISSION_SET', 'Artist', artist.id, { percentage }, { ip: ctx.ip });
      return ok({ artistId: artist.id, percentage });
    },
  },

  // ───────────── Settlements ─────────────
  {
    method: 'GET',
    path: '/admin/settlements/balances',
    roles: ['ADMIN'],
    handler: async () => {
      const groups = await prisma.artistLedger.groupBy({
        by: ['artistId', 'status'],
        where: { status: { in: ['AVAILABLE', 'PENDING'] }, type: { not: 'SETTLEMENT_DEBIT' } },
        _sum: { amount: true },
      });
      const artistIds = [...new Set(groups.map((g) => g.artistId))];
      const artists = await prisma.artist.findMany({ where: { id: { in: artistIds } }, select: artistMiniSelect });
      return ok(
        artists
          .map((a) => {
            const get = (s: string) => Number(groups.find((g) => g.artistId === a.id && g.status === s)?._sum.amount ?? 0);
            return { artist: a, available: get('AVAILABLE'), pending: get('PENDING') };
          })
          .sort((x, y) => y.available - x.available),
      );
    },
  },
  {
    method: 'GET',
    path: '/admin/settlements',
    roles: ['ADMIN'],
    handler: async (ctx) => {
      const q = parse(pagination.extend({ status: z.string().max(20).optional(), artistId: z.string().max(40).optional() }), ctx.query);
      const where: Prisma.SettlementWhereInput = { ...(q.status ? { status: q.status as SettlementStatus } : {}), ...(q.artistId ? { artistId: q.artistId } : {}) };
      const [total, rows] = await Promise.all([
        prisma.settlement.count({ where }),
        prisma.settlement.findMany({ where, include: { artist: { select: artistMiniSelect }, transactions: true }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      ]);
      return ok(
        rows.map((s) => ({ ...s, amount: money(s.amount), transactions: s.transactions.map((t) => ({ ...t, amount: money(t.amount) })) })),
        pageMeta(q.page, q.pageSize, total),
      );
    },
  },
  {
    method: 'POST',
    path: '/admin/settlements',
    roles: ['ADMIN'],
    handler: async (ctx) => {
      const input = parse(
        z.object({
          artistId: z.string().max(40),
          method: z.enum(['BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER']).default('BANK_TRANSFER'),
          reference: z.string().trim().max(120).optional(),
          note: z.string().trim().max(800).optional(),
        }),
        ctx.body,
      );
      const artist = await prisma.artist.findUnique({ where: { id: input.artistId }, select: { id: true, userId: true } });
      if (!artist) throw notFound('Artist');

      const settlement = await prisma.$transaction(async (tx) => {
        const entries = await tx.artistLedger.findMany({ where: { artistId: artist.id, status: 'AVAILABLE', type: { not: 'SETTLEMENT_DEBIT' } } });
        const totalMinor = sumMinor(entries);
        if (totalMinor <= 0) throw conflict('No available balance to settle');
        const s = await tx.settlement.create({
          data: { artistId: artist.id, amount: fromMinor(totalMinor), reference: input.reference, note: `[${input.method}]${input.note ? ' ' + input.note : ''}`, processedById: ctx.user!.id, status: 'PROCESSING' },
        });
        // Only status/settlementId change on existing rows — amounts are immutable.
        const res = await tx.artistLedger.updateMany({ where: { id: { in: entries.map((e) => e.id) }, status: 'AVAILABLE' }, data: { status: 'SETTLED', settlementId: s.id } });
        if (res.count !== entries.length) throw conflict('Balance changed during settlement — retry');
        await tx.artistLedger.create({
          data: { artistId: artist.id, type: 'SETTLEMENT_DEBIT', status: 'SETTLED', amount: fromMinor(-totalMinor), description: `Payout ${s.id}`, settlementId: s.id },
        });
        return s;
      });
      await audit(ctx.user, 'SETTLEMENT_CREATED', 'Settlement', settlement.id, { artistId: artist.id, amount: money(settlement.amount), method: input.method }, { ip: ctx.ip });
      await notify(artist.userId, 'SETTLEMENT_CREATED', 'Payout initiated', `A payout of ₹${money(settlement.amount)} is being processed.`, '/seller/earnings');
      return created({ ...settlement, amount: money(settlement.amount) });
    },
  },
  {
    method: 'PATCH',
    path: '/admin/settlements/:id/complete',
    roles: ['ADMIN'],
    handler: async (ctx) => {
      const input = parse(z.object({ reference: z.string().trim().min(2).max(120), method: z.string().trim().max(40).optional() }), ctx.body);
      const s = await prisma.settlement.findUnique({ where: { id: ctx.params.id }, include: { artist: { select: { userId: true } } } });
      if (!s) throw notFound('Settlement');
      if (s.status === 'COMPLETED') throw conflict('Settlement already completed');
      const method = input.method ?? s.note?.match(/^\[([A-Z_]+)\]/)?.[1] ?? 'BANK_TRANSFER';
      const updated = await prisma.$transaction(async (tx) => {
        await tx.settlementTransaction.create({ data: { settlementId: s.id, amount: s.amount, method, reference: input.reference } });
        return tx.settlement.update({ where: { id: s.id }, data: { status: 'COMPLETED', reference: input.reference, completedAt: new Date() } });
      });
      await audit(ctx.user, 'SETTLEMENT_COMPLETED', 'Settlement', s.id, { reference: input.reference, method }, { ip: ctx.ip });
      await notify(s.artist.userId, 'SETTLEMENT_COMPLETED', 'Payout completed', `₹${money(s.amount)} has been paid out (ref ${input.reference}).`, '/seller/earnings');
      return ok({ ...updated, amount: money(updated.amount) });
    },
  },
];

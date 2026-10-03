import type { PaymentStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { audit, notify } from '../../shared/audit.js';
import { badRequest, notFound } from '../../shared/errors.js';
import { ok, type RouteDef } from '../../shared/http.js';
import { money } from '../../shared/serializers.js';
import { pageMeta, pagination, parse } from '../../shared/validation.js';
import { confirmPayment } from '../orders/order-helpers.js';

/** Admin payment operations (customer-facing /payments/methods lives with checkout). */
export const paymentRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/admin/payments',
    roles: ['ADMIN'],
    handler: async (ctx) => {
      const q = parse(pagination.extend({ status: z.string().max(40).optional() }), ctx.query);
      const where = q.status ? { status: q.status as PaymentStatus } : {};
      const [total, rows] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
          where,
          include: { order: { select: { id: true, orderNumber: true, status: true, customer: { select: { fullName: true, email: true } } } } },
          orderBy: { createdAt: 'desc' },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
        }),
      ]);
      return ok(
        rows.map((p) => ({
          id: p.id,
          provider: p.provider,
          method: p.method,
          status: p.status,
          amount: money(p.amount),
          currency: p.currency,
          providerRef: p.providerRef,
          createdAt: p.createdAt,
          confirmedAt: p.confirmedAt,
          order: p.order,
        })),
        pageMeta(q.page, q.pageSize, total),
      );
    },
  },
  {
    method: 'PATCH',
    path: '/admin/payments/:id/confirm',
    roles: ['ADMIN'],
    handler: async (ctx) => {
      const { reference } = parse(z.object({ reference: z.string().trim().max(120).optional() }), ctx.body ?? {});
      const payment = await confirmPayment(ctx.params.id, reference, ctx.user!.id);
      await audit(ctx.user, 'PAYMENT_CONFIRMED', 'Payment', payment.id, { reference: reference ?? null }, { ip: ctx.ip });
      return ok({ id: payment.id, status: payment.status });
    },
  },
  {
    method: 'PATCH',
    path: '/admin/payments/:id/fail',
    roles: ['ADMIN'],
    handler: async (ctx) => {
      const { reason } = parse(z.object({ reason: z.string().trim().min(3).max(500) }), ctx.body);
      const payment = await prisma.payment.findUnique({ where: { id: ctx.params.id }, include: { order: true } });
      if (!payment) throw notFound('Payment');
      if (!['PENDING', 'AWAITING_CONFIRMATION'].includes(payment.status)) throw badRequest(`Cannot fail a ${payment.status} payment`);
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', meta: { ...((payment.meta as object) ?? {}), failureReason: reason } } });
        await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'FAILED' } });
        await notify(payment.order.customerId, 'PAYMENT_FAILED', 'Payment could not be verified', reason, `/account/orders/${payment.orderId}`, tx);
      });
      await audit(ctx.user, 'PAYMENT_FAILED', 'Payment', payment.id, { reason }, { ip: ctx.ip });
      return ok({ id: payment.id, status: 'FAILED' });
    },
  },
];

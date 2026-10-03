import type { FulfillmentStatus, PaymentMethod, Prisma, ShipmentStatus } from '@prisma/client';
import { z } from 'zod';
import { config } from '../../config/env.js';
import { prisma } from '../../database/prisma/client.js';
import { getPaymentProvider } from '../../providers/payment/index.js';
import { audit, notify } from '../../shared/audit.js';
import { AppError, badRequest, conflict, forbidden, notFound } from '../../shared/errors.js';
import { ok, type RouteDef } from '../../shared/http.js';
import { money } from '../../shared/serializers.js';
import { pageMeta, pagination, parse } from '../../shared/validation.js';
import { fromMinor } from '../../utils/money.js';
import { referenceCode } from '../../utils/slug.js';
import { buildCart } from '../cart/cart.service.js';
import { computeLine, loadCommissionRules, resolveCommission } from '../finance/commission.js';
import { loadOrderDetail, orderSummary, refreshOrderFulfillment } from './order-helpers.js';

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(20),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(12),
  country: z.string().trim().max(60).default('IN'),
});

const checkoutSchema = z.object({
  addressId: z.string().max(40).optional(),
  shippingAddress: addressSchema.optional(),
  paymentMethod: z.enum(['COD', 'MANUAL', 'RAZORPAY', 'STRIPE', 'PAYU']),
  notes: z.string().trim().max(1000).optional(),
});

function requireArtist(user: { artistId: string | null; artistStatus: string | null }) {
  if (!user.artistId) throw forbidden('Artist account required');
  return user.artistId;
}

export const orderRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/payments/methods',
    auth: 'required',
    handler: async (ctx) => {
      const cart = await buildCart(ctx.user!.id);
      const hasDigital = cart.lines.some((l) => l.format === 'DIGITAL');
      return ok([
        {
          method: 'COD',
          label: 'Cash on Delivery',
          description: 'Pay in cash when your artwork arrives.',
          available: cart.lines.length > 0 && !hasDigital,
          reason: hasDigital ? 'Not available for digital artwork' : undefined,
        },
        {
          method: 'MANUAL',
          label: 'Bank Transfer / UPI',
          description: 'Transfer the amount and our team will confirm your payment.',
          available: cart.lines.length > 0,
        },
      ]);
    },
  },
  {
    method: 'POST',
    path: '/orders/checkout',
    auth: 'required',
    rateLimit: 'strict',
    handler: async (ctx) => {
      const input = parse(checkoutSchema, ctx.body);
      const user = ctx.user!;
      const cart = await buildCart(user.id);
      if (!cart.lines.length) throw badRequest('Your cart is empty');
      const unavailable = cart.lines.filter((l) => !l.available);
      if (unavailable.length) {
        throw new AppError(409, 'CART_UNAVAILABLE', 'Some items in your cart are no longer available', unavailable.map((l) => ({ cartItemId: l.cartItemId, title: l.title, reason: l.unavailableReason })));
      }
      const method = input.paymentMethod as PaymentMethod;
      if (method === 'COD' && cart.lines.some((l) => l.format === 'DIGITAL')) {
        throw badRequest('Cash on Delivery is only available when every item is shipped physically');
      }
      const provider = getPaymentProvider(method);

      let shippingAddress: Prisma.InputJsonValue | undefined;
      if (cart.view.requiresShipping) {
        if (input.addressId) {
          const a = await prisma.customerAddress.findFirst({ where: { id: input.addressId, userId: user.id } });
          if (!a) throw notFound('Address');
          shippingAddress = { fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, postalCode: a.postalCode, country: a.country };
        } else if (input.shippingAddress) {
          shippingAddress = input.shippingAddress;
        } else {
          throw badRequest('A shipping address is required for physical artwork');
        }
      }

      const rules = await loadCommissionRules();
      const totalMinor = cart.subtotalMinor + cart.shippingMinor;
      const orderNumber = referenceCode('AG');

      const orderId = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            customerId: user.id,
            paymentMethod: method,
            subtotal: fromMinor(cart.subtotalMinor),
            shippingFee: fromMinor(cart.shippingMinor),
            total: fromMinor(totalMinor),
            currency: config.DEFAULT_CURRENCY,
            shippingAddress,
            notes: input.notes,
          },
        });

        for (const line of cart.lines) {
          // Atomic stock decrement guarded by a quantity check (prevents overselling under concurrency).
          if (line.artworkId && line.format !== 'DIGITAL') {
            const res = await tx.artworkInventory.updateMany({
              where: { artworkId: line.artworkId, quantity: { gte: line.quantity } },
              data: { quantity: { decrement: line.quantity } },
            });
            if (res.count !== 1) throw conflict(`"${line.title}" just sold out`);
            const inv = await tx.artworkInventory.findUniqueOrThrow({ where: { artworkId: line.artworkId } });
            if (inv.quantity - inv.reserved <= 0) await tx.artwork.update({ where: { id: line.artworkId }, data: { status: 'SOLD_OUT' } });
          }
          if (line.artworkId) await tx.artwork.update({ where: { id: line.artworkId }, data: { salesCount: { increment: line.quantity } } });

          const resolved = resolveCommission(rules, {
            kind: line.customArtRequestId ? 'CUSTOM_ART' : 'ARTWORK',
            artistId: line.artistId,
            artworkId: line.artworkId,
            categoryId: line.categoryId,
          });
          const split = computeLine(fromMinor(line.unitMinor), line.quantity, resolved.percentage);
          const item = await tx.orderItem.create({
            data: {
              orderId: order.id,
              artistId: line.artistId,
              artworkId: line.artworkId,
              customArtRequestId: line.customArtRequestId,
              titleSnapshot: line.title.slice(0, 190),
              imageSnapshot: line.image,
              format: line.format,
              fulfillmentType: line.format === 'DIGITAL' ? 'DIGITAL' : 'PHYSICAL',
              unitPrice: fromMinor(line.unitMinor),
              quantity: line.quantity,
              lineTotal: fromMinor(split.grossMinor),
              commissionRate: resolved.percentage,
              commissionAmount: fromMinor(split.commissionMinor),
              artistAmount: fromMinor(split.artistMinor),
            },
          });
          await tx.commission.create({
            data: {
              orderItemId: item.id,
              ruleScope: resolved.scope,
              ruleId: resolved.ruleId,
              percentage: resolved.percentage,
              grossAmount: fromMinor(split.grossMinor),
              amount: fromMinor(split.commissionMinor),
              artistAmount: fromMinor(split.artistMinor),
            },
          });
          await tx.artistLedger.createMany({
            data: [
              { artistId: line.artistId, type: 'SALE_CREDIT', amount: fromMinor(split.grossMinor), description: `Sale: ${line.title} (${orderNumber})`.slice(0, 190), orderItemId: item.id },
              { artistId: line.artistId, type: 'COMMISSION_DEBIT', amount: fromMinor(-split.commissionMinor), description: `Platform commission ${resolved.percentage}% (${orderNumber})`, orderItemId: item.id },
            ],
          });
        }

        const physicalArtists = [...new Set(cart.lines.filter((l) => l.format !== 'DIGITAL').map((l) => l.artistId))];
        if (physicalArtists.length) await tx.shipment.createMany({ data: physicalArtists.map((artistId) => ({ orderId: order.id, artistId })) });

        const created = await provider.createPayment({ orderId: order.id, orderNumber, amount: fromMinor(totalMinor), currency: config.DEFAULT_CURRENCY }, method);
        await tx.payment.create({
          data: {
            orderId: order.id,
            provider: created.provider,
            method,
            status: created.status,
            amount: fromMinor(totalMinor),
            currency: config.DEFAULT_CURRENCY,
            providerRef: created.providerRef,
            meta: { instructions: created.instructions ?? null },
          },
        });
        await tx.order.update({ where: { id: order.id }, data: { paymentStatus: created.status } });
        await tx.cartItem.deleteMany({ where: { cartId: cart.cartId } });

        const artistUsers = await tx.artist.findMany({ where: { id: { in: [...new Set(cart.lines.map((l) => l.artistId))] } }, select: { userId: true } });
        for (const a of artistUsers) {
          await notify(a.userId, 'NEW_ORDER', 'New order received', `Order ${orderNumber} includes your artwork.`, '/seller/orders', tx);
        }
        await notify(user.id, 'ORDER_PLACED', 'Order placed', `Your order ${orderNumber} has been placed.`, `/account/orders/${order.id}`, tx);
        return order.id;
      });
      await audit(user, 'ORDER_PLACED', 'Order', orderId, { orderNumber, total: fromMinor(totalMinor), method }, { ip: ctx.ip });
      return { status: 201, data: await loadOrderDetail(orderId, { customerId: user.id }) };
    },
  },
  {
    method: 'GET',
    path: '/orders',
    auth: 'required',
    handler: async (ctx) => {
      const q = parse(pagination, ctx.query);
      const where = { customerId: ctx.user!.id };
      const [total, rows] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({ where, include: { items: { select: { quantity: true, imageSnapshot: true } } }, orderBy: { placedAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      ]);
      return ok(rows.map(orderSummary), pageMeta(q.page, q.pageSize, total));
    },
  },
  {
    method: 'GET',
    path: '/orders/:id',
    auth: 'required',
    handler: async (ctx) => ok(await loadOrderDetail(ctx.params.id, { customerId: ctx.user!.id })),
  },
  {
    method: 'POST',
    path: '/orders/:id/cancel',
    auth: 'required',
    handler: async (ctx) => {
      const order = await prisma.order.findFirst({ where: { id: ctx.params.id, customerId: ctx.user!.id } });
      if (!order) throw notFound('Order');
      if (!['PENDING', 'CONFIRMED'].includes(order.status) || order.paymentStatus === 'PAID') {
        throw conflict('This order can no longer be cancelled. Please contact support.');
      }
      await cancelOrder(order.id);
      await audit(ctx.user, 'ORDER_CANCELLED', 'Order', order.id, { by: 'CUSTOMER' }, { ip: ctx.ip });
      return ok(await loadOrderDetail(order.id, { customerId: ctx.user!.id }));
    },
  },

  // ───────────── Seller views (always scoped to the caller's own artist id) ─────────────
  {
    method: 'GET',
    path: '/artists/me/orders',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const artistId = requireArtist(ctx.user!);
      const q = parse(pagination.extend({ status: z.string().max(40).optional() }), ctx.query);
      const where: Prisma.OrderWhereInput = { items: { some: { artistId } }, ...(q.status ? { status: q.status as Prisma.EnumOrderStatusFilter['equals'] } : {}) };
      const [total, rows] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          orderBy: { placedAt: 'desc' },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
          include: {
            customer: { select: { fullName: true } },
            items: { where: { artistId } },
            shipments: { where: { artistId } },
          },
        }),
      ]);
      return ok(
        rows.map((o) => {
          const hasPhysical = o.items.some((i) => i.fulfillmentType === 'PHYSICAL');
          const s = o.shipments[0];
          return {
            orderId: o.id,
            orderNumber: o.orderNumber,
            placedAt: o.placedAt,
            status: o.status,
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod,
            customer: { fullName: o.customer.fullName },
            shippingAddress: hasPhysical ? o.shippingAddress : null,
            items: o.items.map((i) => ({
              id: i.id,
              titleSnapshot: i.titleSnapshot,
              imageSnapshot: i.imageSnapshot,
              format: i.format,
              fulfillmentType: i.fulfillmentType,
              fulfillmentStatus: i.fulfillmentStatus,
              quantity: i.quantity,
              lineTotal: money(i.lineTotal)!,
              commissionAmount: money(i.commissionAmount)!,
              artistAmount: money(i.artistAmount)!,
              customArtRequestId: i.customArtRequestId,
            })),
            shipment: s
              ? { id: s.id, carrier: s.carrier, method: s.method, trackingNumber: s.trackingNumber, packagingInfo: s.packagingInfo, status: s.status, shippedAt: s.shippedAt, deliveredAt: s.deliveredAt }
              : null,
          };
        }),
        pageMeta(q.page, q.pageSize, total),
      );
    },
  },
  {
    method: 'PATCH',
    path: '/artists/me/orders/:orderId/shipment',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const artistId = requireArtist(ctx.user!);
      const input = parse(
        z.object({
          carrier: z.string().trim().max(80).optional(),
          method: z.string().trim().max(80).optional(),
          trackingNumber: z.string().trim().max(80).optional(),
          packagingInfo: z.string().trim().max(1000).optional(),
          status: z.enum(['PENDING', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED']).optional(),
        }),
        ctx.body,
      );
      const order = await prisma.order.findFirst({
        where: { id: ctx.params.orderId, items: { some: { artistId, fulfillmentType: 'PHYSICAL' } } },
      });
      if (!order) throw notFound('Order');
      if (order.status === 'CANCELLED') throw conflict('Order is cancelled');
      if (input.status && ['SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(input.status) && order.paymentMethod !== 'COD' && order.paymentStatus !== 'PAID') {
        throw conflict('Wait for payment confirmation before shipping');
      }
      if (input.status && ['SHIPPED', 'IN_TRANSIT'].includes(input.status) && !(input.trackingNumber || (await prisma.shipment.findUnique({ where: { orderId_artistId: { orderId: order.id, artistId } } }))?.trackingNumber)) {
        throw badRequest('A tracking number is required to mark the shipment as shipped');
      }

      await prisma.$transaction(async (tx) => {
        const now = new Date();
        const status = input.status as ShipmentStatus | undefined;
        await tx.shipment.upsert({
          where: { orderId_artistId: { orderId: order.id, artistId } },
          create: {
            orderId: order.id,
            artistId,
            carrier: input.carrier,
            method: input.method,
            trackingNumber: input.trackingNumber,
            packagingInfo: input.packagingInfo,
            status: status ?? 'PENDING',
            shippedAt: status === 'SHIPPED' ? now : undefined,
            deliveredAt: status === 'DELIVERED' ? now : undefined,
          },
          update: {
            carrier: input.carrier,
            method: input.method,
            trackingNumber: input.trackingNumber,
            packagingInfo: input.packagingInfo,
            status,
            ...(status === 'SHIPPED' ? { shippedAt: now } : {}),
            ...(status === 'DELIVERED' ? { deliveredAt: now } : {}),
          },
        });
        const itemStatus: Partial<Record<ShipmentStatus, FulfillmentStatus>> = { PACKED: 'PACKED', SHIPPED: 'SHIPPED', IN_TRANSIT: 'SHIPPED', DELIVERED: 'DELIVERED' };
        if (status && itemStatus[status]) {
          await tx.orderItem.updateMany({
            where: { orderId: order.id, artistId, fulfillmentType: 'PHYSICAL', fulfillmentStatus: { not: 'CANCELLED' } },
            data: { fulfillmentStatus: itemStatus[status] },
          });
        }
        await refreshOrderFulfillment(tx, order.id);
        if (status) {
          await notify(order.customerId, 'SHIPMENT_UPDATE', `Order ${order.orderNumber}: ${status.toLowerCase().replace('_', ' ')}`, input.trackingNumber ? `Tracking: ${input.carrier ?? ''} ${input.trackingNumber}` : undefined, `/account/orders/${order.id}`, tx);
        }
      });
      await audit(ctx.user, 'SHIPMENT_UPDATED', 'Order', order.id, input, { ip: ctx.ip });
      return ok({ updated: true });
    },
  },
  {
    method: 'PATCH',
    path: '/artists/me/order-items/:id/fulfillment',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const artistId = requireArtist(ctx.user!);
      const { status } = parse(z.object({ status: z.enum(['PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED']) }), ctx.body);
      const item = await prisma.orderItem.findFirst({ where: { id: ctx.params.id, artistId }, include: { order: true } });
      if (!item) throw notFound('Order item');
      if (item.fulfillmentType !== 'PHYSICAL') throw badRequest('Digital items are delivered automatically after payment');
      if (item.order.status === 'CANCELLED') throw conflict('Order is cancelled');
      await prisma.$transaction(async (tx) => {
        await tx.orderItem.update({ where: { id: item.id }, data: { fulfillmentStatus: status } });
        await refreshOrderFulfillment(tx, item.orderId);
      });
      await audit(ctx.user, 'FULFILLMENT_UPDATED', 'OrderItem', item.id, { status }, { ip: ctx.ip });
      return ok({ updated: true });
    },
  },
];

/** Cancels an order: restocks, reverses ledger entries (status only), voids pending payments. */
export async function cancelOrder(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    if (order.status === 'CANCELLED') throw conflict('Order is already cancelled');
    for (const item of order.items) {
      if (item.artworkId && item.format !== 'DIGITAL') {
        await tx.artworkInventory.updateMany({ where: { artworkId: item.artworkId }, data: { quantity: { increment: item.quantity } } });
        await tx.artwork.updateMany({ where: { id: item.artworkId, status: 'SOLD_OUT' }, data: { status: 'APPROVED' } });
      }
      if (item.artworkId) await tx.artwork.update({ where: { id: item.artworkId }, data: { salesCount: { decrement: item.quantity } } });
    }
    const itemIds = order.items.map((i) => i.id);
    await tx.artistLedger.updateMany({ where: { orderItemId: { in: itemIds }, status: { in: ['PENDING', 'AVAILABLE'] } }, data: { status: 'REVERSED' } });
    await tx.orderItem.updateMany({ where: { orderId }, data: { fulfillmentStatus: 'CANCELLED' } });
    await tx.downloadAccess.updateMany({ where: { orderItemId: { in: itemIds }, revokedAt: null }, data: { revokedAt: new Date() } });
    await tx.payment.updateMany({ where: { orderId, status: { in: ['PENDING', 'AWAITING_CONFIRMATION'] } }, data: { status: 'FAILED' } });
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED', paymentStatus: order.paymentStatus === 'PAID' ? 'PAID' : 'FAILED' },
    });
    await notify(order.customerId, 'ORDER_CANCELLED', 'Order cancelled', `Order ${order.orderNumber} was cancelled.`, `/account/orders/${order.id}`, tx);
  });
}

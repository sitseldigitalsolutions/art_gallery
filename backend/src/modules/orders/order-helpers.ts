import type { OrderStatus, Prisma } from '@prisma/client';
import { config } from '../../config/env.js';
import { prisma } from '../../database/prisma/client.js';
import { notify } from '../../shared/audit.js';
import { badRequest, conflict, notFound } from '../../shared/errors.js';
import { artistMiniSelect, money } from '../../shared/serializers.js';
import { getPaymentProvider } from '../../providers/payment/index.js';

export type Tx = Prisma.TransactionClient;

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'COMPLETED'];

/** Reads a SystemSetting value (JSON) with a fallback. */
export async function getSetting<T>(key: string, fallback: T, tx: Tx | typeof prisma = prisma): Promise<T> {
  const row = await tx.systemSetting.findUnique({ where: { key } });
  return row ? (row.value as T) : fallback;
}

/**
 * Idempotently grants digital download access for an order item once it is paid.
 * Returns false when there is no deliverable file yet (e.g. artist has not uploaded it).
 */
export async function grantDigitalAccess(tx: Tx, orderItemId: string): Promise<boolean> {
  const item = await tx.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: { select: { customerId: true, paymentStatus: true } },
      artwork: { select: { digitalFileKey: true } },
      customArtRequest: { select: { images: { where: { kind: 'FINAL' }, orderBy: { createdAt: 'desc' }, take: 1 } } },
    },
  });
  if (!item || item.fulfillmentType !== 'DIGITAL' || item.order.paymentStatus !== 'PAID') return false;
  const existing = await tx.downloadAccess.findFirst({ where: { orderItemId, revokedAt: null } });
  if (existing) return true;

  const storageKey = item.artwork?.digitalFileKey ?? item.customArtRequest?.images[0]?.storageKey ?? null;
  if (!storageKey) return false;

  const limit = await getSetting<number>('digital.downloadLimit', config.DIGITAL_DOWNLOAD_LIMIT, tx);
  const days = await getSetting<number>('digital.downloadExpiryDays', config.DIGITAL_DOWNLOAD_EXPIRY_DAYS, tx);
  await tx.downloadAccess.create({
    data: {
      orderItemId,
      userId: item.order.customerId,
      artworkId: item.artworkId,
      storageKey,
      maxDownloads: Number(limit),
      expiresAt: new Date(Date.now() + Number(days) * 86_400_000),
    },
  });
  await tx.orderItem.update({ where: { id: orderItemId }, data: { fulfillmentStatus: 'DIGITAL_AVAILABLE' } });
  await notify(
    item.order.customerId,
    'DOWNLOAD_READY',
    'Your digital artwork is ready',
    `${item.titleSnapshot} is available to download.`,
    `/account/orders/${item.orderId}`,
    tx,
  );
  return true;
}

/** Recomputes order status from its items (FULFILLED once every item is delivered / available). */
export async function refreshOrderFulfillment(tx: Tx, orderId: string) {
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.status === 'CANCELLED' || order.status === 'COMPLETED') return;
  const done = (s: string) => s === 'DELIVERED' || s === 'DIGITAL_AVAILABLE' || s === 'CANCELLED';
  const live = order.items.filter((i) => i.fulfillmentStatus !== 'CANCELLED');
  const doneCount = live.filter((i) => done(i.fulfillmentStatus)).length;
  let status = order.status;
  if (live.length > 0 && doneCount === live.length) status = 'FULFILLED';
  else if (doneCount > 0) status = 'PARTIALLY_FULFILLED';
  else if (live.some((i) => ['PROCESSING', 'PACKED', 'SHIPPED'].includes(i.fulfillmentStatus)) && ['PENDING', 'CONFIRMED'].includes(order.status)) {
    status = 'PROCESSING';
  }
  if (status !== order.status) await tx.order.update({ where: { id: orderId }, data: { status } });
}

/** Marks a payment as collected/received and releases everything that waits on payment. */
export async function confirmPayment(paymentId: string, reference: string | undefined, confirmedById: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
    if (!payment) throw notFound('Payment');
    if (payment.status === 'PAID') throw conflict('Payment is already confirmed');
    if (!['PENDING', 'AWAITING_CONFIRMATION'].includes(payment.status)) throw badRequest(`Cannot confirm a ${payment.status} payment`);
    if (payment.order.status === 'CANCELLED') throw conflict('Order is cancelled');

    const result = await getPaymentProvider(payment.method).confirmPayment(payment, reference);
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: result.status, providerRef: result.providerRef ?? payment.providerRef, confirmedById, confirmedAt: new Date() },
    });
    await tx.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: 'PAID', status: payment.order.status === 'PENDING' ? 'CONFIRMED' : payment.order.status },
    });

    const items = await tx.orderItem.findMany({ where: { orderId: payment.orderId } });
    await tx.artistLedger.updateMany({
      where: { orderItemId: { in: items.map((i) => i.id) }, status: 'PENDING' },
      data: { status: 'AVAILABLE' },
    });
    for (const item of items.filter((i) => i.fulfillmentType === 'DIGITAL')) await grantDigitalAccess(tx, item.id);
    await refreshOrderFulfillment(tx, payment.orderId);

    await notify(payment.order.customerId, 'PAYMENT_CONFIRMED', 'Payment confirmed', `Payment for order ${payment.order.orderNumber} has been confirmed.`, `/account/orders/${payment.orderId}`, tx);
    return tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
  });
}

const orderDetailInclude = {
  items: {
    include: {
      artist: { select: artistMiniSelect },
      artwork: { select: { slug: true } },
      reviews: { select: { userId: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
  shipments: { include: { artist: { select: artistMiniSelect } } },
  payments: { orderBy: { createdAt: 'asc' } },
  customer: { select: { id: true, fullName: true, email: true, phone: true } },
} satisfies Prisma.OrderInclude;

type OrderWithDetail = Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>;

export function orderSummary(o: { id: string; orderNumber: string; status: string; paymentStatus: string; paymentMethod: string; total: Prisma.Decimal; currency: string; placedAt: Date; items: Array<{ quantity: number; imageSnapshot: string | null }> }) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    total: money(o.total)!,
    currency: o.currency,
    placedAt: o.placedAt,
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    previewImage: o.items.find((i) => i.imageSnapshot)?.imageSnapshot ?? null,
  };
}

export async function loadOrderDetail(orderId: string, opts: { customerId?: string; includeCustomer?: boolean } = {}) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, ...(opts.customerId ? { customerId: opts.customerId } : {}) },
    include: orderDetailInclude,
  });
  if (!order) throw notFound('Order');
  return serializeOrder(order, opts.includeCustomer ?? false);
}

async function serializeOrder(o: OrderWithDetail, includeCustomer: boolean) {
  const downloads = await prisma.downloadAccess.findMany({
    where: { orderItemId: { in: o.items.map((i) => i.id) }, userId: o.customerId, revokedAt: null },
    include: { orderItem: { select: { titleSnapshot: true } } },
  });
  const orderDone = o.status === 'COMPLETED';
  return {
    ...orderSummary(o),
    subtotal: money(o.subtotal)!,
    shippingFee: money(o.shippingFee)!,
    discountTotal: money(o.discountTotal)!,
    shippingAddress: o.shippingAddress,
    notes: o.notes,
    items: o.items.map((i) => ({
      id: i.id,
      titleSnapshot: i.titleSnapshot,
      imageSnapshot: i.imageSnapshot,
      format: i.format,
      fulfillmentType: i.fulfillmentType,
      fulfillmentStatus: i.fulfillmentStatus,
      unitPrice: money(i.unitPrice)!,
      quantity: i.quantity,
      lineTotal: money(i.lineTotal)!,
      artist: i.artist,
      artworkId: i.artworkId,
      artworkSlug: i.artwork?.slug ?? null,
      customArtRequestId: i.customArtRequestId,
      canReview:
        !!i.artworkId &&
        (orderDone || i.fulfillmentStatus === 'DELIVERED' || i.fulfillmentStatus === 'DIGITAL_AVAILABLE') &&
        !i.reviews.some((r) => r.userId === o.customerId),
    })),
    shipments: o.shipments.map((s) => ({
      id: s.id,
      artist: s.artist,
      carrier: s.carrier,
      method: s.method,
      trackingNumber: s.trackingNumber,
      status: s.status,
      shippedAt: s.shippedAt,
      deliveredAt: s.deliveredAt,
    })),
    payments: o.payments.map((p) => ({
      id: p.id,
      method: p.method,
      provider: p.provider,
      status: p.status,
      amount: money(p.amount)!,
      providerRef: p.providerRef,
      instructions: (p.meta as { instructions?: string } | null)?.instructions ?? null,
      createdAt: p.createdAt,
      confirmedAt: p.confirmedAt,
    })),
    downloads: downloads.map((d) => ({
      id: d.id,
      orderItemId: d.orderItemId,
      title: d.orderItem.titleSnapshot,
      remaining: Math.max(0, d.maxDownloads - d.downloadCount),
      expiresAt: d.expiresAt,
    })),
    ...(includeCustomer ? { customer: o.customer } : {}),
  };
}

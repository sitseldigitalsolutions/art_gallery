import type { ArtworkFormat, Prisma } from '@prisma/client';
import { config } from '../../config/env.js';
import { prisma } from '../../database/prisma/client.js';
import { createSignedFileUrl } from '../../providers/storage/signed-url.js';
import { artistMiniSelect, artworkCardSelect, availableQuantity, money, toArtworkCard } from '../../shared/serializers.js';
import { fromMinor, toMinor } from '../../utils/money.js';
import { ACTIVE_ORDER_STATUSES, getSetting } from '../orders/order-helpers.js';

export async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
}

const cartItemInclude = {
  artwork: {
    select: {
      ...artworkCardSelect,
      categoryId: true,
      artist: { select: { ...artistMiniSelect, status: true, user: { select: { status: true } } } },
    },
  },
  customArtRequest: {
    select: {
      id: true,
      requestNumber: true,
      title: true,
      status: true,
      customerId: true,
      quotedPrice: true,
      currency: true,
      requestedFormat: true,
      artistId: true,
      artist: { select: artistMiniSelect },
      images: { where: { kind: 'PREVIEW' }, orderBy: { createdAt: 'desc' }, take: 1, select: { storageKey: true } },
      orderItems: { where: { order: { status: { in: [...ACTIVE_ORDER_STATUSES] } } }, select: { id: true }, take: 1 },
    },
  },
} satisfies Prisma.CartItemInclude;

export interface PricedLine {
  cartItemId: string;
  quantity: number;
  unitMinor: number;
  lineMinor: number;
  available: boolean;
  unavailableReason: string | null;
  format: ArtworkFormat;
  artistId: string;
  title: string;
  image: string | null;
  artworkId: string | null;
  categoryId: string | null;
  customArtRequestId: string | null;
}

/** Loads and prices the cart with live availability. Used by GET /cart and checkout. */
export async function buildCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  const items = await prisma.cartItem.findMany({ where: { cartId: cart.id }, include: cartItemInclude, orderBy: { createdAt: 'asc' } });

  const lines: PricedLine[] = [];
  const view = items.map((item) => {
    if (item.artwork) {
      const a = item.artwork;
      const publicOk = ['APPROVED'].includes(a.status) && a.artist.status === 'APPROVED' && a.artist.user.status === 'ACTIVE';
      const qtyOk = availableQuantity(a) >= item.quantity;
      const unitMinor = toMinor(a.discountPrice ?? a.price);
      const available = publicOk && qtyOk;
      const artistMini = { id: a.artist.id, slug: a.artist.slug, displayName: a.artist.displayName, avatarUrl: a.artist.avatarUrl };
      const card = toArtworkCard({ ...a, artist: artistMini });
      lines.push({
        cartItemId: item.id,
        quantity: item.quantity,
        unitMinor,
        lineMinor: unitMinor * item.quantity,
        available,
        unavailableReason: !publicOk ? 'No longer available' : !qtyOk ? 'Not enough stock' : null,
        format: a.format,
        artistId: a.artist.id,
        title: a.title,
        image: card.thumbnailUrl,
        artworkId: a.id,
        categoryId: a.categoryId,
        customArtRequestId: null,
      });
      return { id: item.id, quantity: item.quantity, unitPrice: Number(fromMinor(unitMinor)), lineTotal: Number(fromMinor(unitMinor * item.quantity)), available, unavailableReason: lines.at(-1)!.unavailableReason, artwork: card, customArt: null };
    }
    const r = item.customArtRequest!;
    const unitMinor = toMinor(r.quotedPrice ?? 0);
    const available = r.status === 'CUSTOMER_APPROVED' && r.customerId === userId && !!r.quotedPrice && r.orderItems.length === 0;
    lines.push({
      cartItemId: item.id,
      quantity: 1,
      unitMinor,
      lineMinor: unitMinor,
      available,
      unavailableReason: available ? null : 'Custom art request is not ready for purchase',
      format: r.requestedFormat,
      artistId: r.artistId,
      title: `Custom art ${r.requestNumber}${r.title ? ` — ${r.title}` : ''}`,
      image: null,
      artworkId: null,
      categoryId: null,
      customArtRequestId: r.id,
    });
    return {
      id: item.id,
      quantity: 1,
      unitPrice: Number(fromMinor(unitMinor)),
      lineTotal: Number(fromMinor(unitMinor)),
      available,
      unavailableReason: lines.at(-1)!.unavailableReason,
      artwork: null,
      customArt: {
        id: r.id,
        requestNumber: r.requestNumber,
        title: r.title,
        quotedPrice: money(r.quotedPrice),
        format: r.requestedFormat,
        artist: r.artist,
        previewUrl: r.images[0] ? createSignedFileUrl(r.images[0].storageKey, userId) : null,
      },
    };
  });

  const requiresShipping = lines.some((l) => l.format !== 'DIGITAL');
  const subtotalMinor = lines.reduce((s, l) => s + l.lineMinor, 0);
  const flatFee = Number(await getSetting<number>('shipping.flatFee', 0));
  const shippingMinor = requiresShipping && lines.length ? toMinor(flatFee) : 0;
  return {
    cartId: cart.id,
    lines,
    view: {
      items: view,
      subtotal: Number(fromMinor(subtotalMinor)),
      shippingFee: Number(fromMinor(shippingMinor)),
      total: Number(fromMinor(subtotalMinor + shippingMinor)),
      currency: config.DEFAULT_CURRENCY,
      itemCount: lines.reduce((s, l) => s + l.quantity, 0),
      requiresShipping,
    },
    subtotalMinor,
    shippingMinor,
  };
}

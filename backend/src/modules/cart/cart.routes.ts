import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { badRequest, conflict, notFound } from '../../shared/errors.js';
import { ok, type RouteDef } from '../../shared/http.js';
import { availableQuantity, publicArtworkWhere } from '../../shared/serializers.js';
import { parse } from '../../shared/validation.js';
import { ACTIVE_ORDER_STATUSES } from '../orders/order-helpers.js';
import { buildCart, getOrCreateCart } from './cart.service.js';

const MAX_QTY = 10;

export const cartRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/cart',
    auth: 'required',
    handler: async (ctx) => ok((await buildCart(ctx.user!.id)).view),
  },
  {
    method: 'POST',
    path: '/cart/items',
    auth: 'required',
    handler: async (ctx) => {
      const input = parse(
        z
          .object({
            artworkId: z.string().max(40).optional(),
            customArtRequestId: z.string().max(40).optional(),
            quantity: z.coerce.number().int().min(1).max(MAX_QTY).default(1),
          })
          .refine((v) => !!v.artworkId !== !!v.customArtRequestId, 'Provide either artworkId or customArtRequestId'),
        ctx.body,
      );
      const cart = await getOrCreateCart(ctx.user!.id);

      if (input.artworkId) {
        const artwork = await prisma.artwork.findFirst({
          where: { id: input.artworkId, ...publicArtworkWhere, status: 'APPROVED' },
          select: { id: true, artistId: true, format: true, inventory: true },
        });
        if (!artwork) throw notFound('Artwork');
        if (artwork.artistId === ctx.user!.artistId) throw badRequest('You cannot buy your own artwork');
        const existing = await prisma.cartItem.findUnique({ where: { cartId_artworkId: { cartId: cart.id, artworkId: artwork.id } } });
        const quantity = artwork.format === 'ORIGINAL' ? 1 : Math.min(MAX_QTY, (existing?.quantity ?? 0) + input.quantity);
        if (availableQuantity(artwork) < quantity) throw conflict('Not enough stock available');
        await prisma.cartItem.upsert({
          where: { cartId_artworkId: { cartId: cart.id, artworkId: artwork.id } },
          update: { quantity },
          create: { cartId: cart.id, artworkId: artwork.id, quantity },
        });
      } else {
        const request = await prisma.customArtRequest.findFirst({
          where: { id: input.customArtRequestId, customerId: ctx.user!.id },
          include: { orderItems: { where: { order: { status: { in: [...ACTIVE_ORDER_STATUSES] } } }, take: 1 } },
        });
        if (!request) throw notFound('Custom art request');
        if (request.status !== 'CUSTOMER_APPROVED') throw conflict('Approve the preview before purchasing');
        if (!request.quotedPrice) throw conflict('The artist has not quoted a price');
        if (request.orderItems.length) throw conflict('This request has already been ordered');
        await prisma.cartItem.upsert({
          where: { cartId_customArtRequestId: { cartId: cart.id, customArtRequestId: request.id } },
          update: {},
          create: { cartId: cart.id, customArtRequestId: request.id, quantity: 1 },
        });
      }
      return { status: 201, data: (await buildCart(ctx.user!.id)).view };
    },
  },
  {
    method: 'PATCH',
    path: '/cart/items/:id',
    auth: 'required',
    handler: async (ctx) => {
      const { quantity } = parse(z.object({ quantity: z.coerce.number().int().min(1).max(MAX_QTY) }), ctx.body);
      const item = await prisma.cartItem.findFirst({
        where: { id: ctx.params.id, cart: { userId: ctx.user!.id } },
        include: { artwork: { select: { format: true, inventory: true } } },
      });
      if (!item) throw notFound('Cart item');
      if (!item.artwork) throw badRequest('Custom art quantity cannot be changed');
      if (item.artwork.format === 'ORIGINAL' && quantity > 1) throw badRequest('Original artworks are one of a kind');
      if (availableQuantity(item.artwork) < quantity) throw conflict('Not enough stock available');
      await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
      return ok((await buildCart(ctx.user!.id)).view);
    },
  },
  {
    method: 'DELETE',
    path: '/cart/items/:id',
    auth: 'required',
    handler: async (ctx) => {
      const res = await prisma.cartItem.deleteMany({ where: { id: ctx.params.id, cart: { userId: ctx.user!.id } } });
      if (!res.count) throw notFound('Cart item');
      return ok((await buildCart(ctx.user!.id)).view);
    },
  },
];

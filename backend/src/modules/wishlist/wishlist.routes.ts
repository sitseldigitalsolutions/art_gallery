import type { WishlistItemType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { notFound } from '../../shared/errors.js';
import { created, ok, type RouteDef } from '../../shared/http.js';
import { artistCardSelect, artworkCardSelect, publicArtistWhere, publicArtworkWhere, toArtistCard, toArtworkCard } from '../../shared/serializers.js';
import { parse } from '../../shared/validation.js';
import { collectionCardSelect, publicCollectionWhere, toCollectionCard } from '../collections/collection.service.js';
import { galleryCardSelect, publicGalleryWhere, toGalleryCard } from '../galleries/gallery.service.js';

const ITEM_TYPES = ['ARTWORK', 'ARTIST', 'GALLERY', 'COLLECTION'] as const;

async function defaultWishlist(userId: string) {
  const existing = await prisma.wishlist.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
  return existing ?? prisma.wishlist.create({ data: { userId } });
}

/** Only publicly visible targets can be saved. */
async function assertTarget(itemType: WishlistItemType, targetId: string) {
  const exists =
    itemType === 'ARTWORK'
      ? await prisma.artwork.count({ where: { AND: [publicArtworkWhere, { id: targetId }] } })
      : itemType === 'ARTIST'
        ? await prisma.artist.count({ where: { AND: [publicArtistWhere, { id: targetId }] } })
        : itemType === 'GALLERY'
          ? await prisma.gallery.count({ where: { AND: [publicGalleryWhere, { id: targetId }] } })
          : await prisma.artworkCollection.count({ where: { AND: [publicCollectionWhere, { id: targetId }] } });
  if (!exists) throw notFound(itemType.toLowerCase());
}

export const wishlistRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/wishlist',
    auth: 'required',
    handler: async (ctx) => {
      const items = await prisma.wishlistItem.findMany({
        where: { wishlist: { userId: ctx.user!.id } },
        orderBy: { createdAt: 'desc' },
        select: { itemType: true, targetId: true },
      });
      const ids = (t: WishlistItemType) => items.filter((i) => i.itemType === t).map((i) => i.targetId);
      const order = (t: WishlistItemType) => new Map(ids(t).map((id, idx) => [id, idx]));
      const sortBy = <T extends { id: string }>(rows: T[], t: WishlistItemType) => {
        const o = order(t);
        return rows.sort((a, b) => (o.get(a.id) ?? 0) - (o.get(b.id) ?? 0));
      };
      const [artworks, artists, galleries, collections] = await Promise.all([
        prisma.artwork.findMany({ where: { AND: [publicArtworkWhere, { id: { in: ids('ARTWORK') } }] }, select: artworkCardSelect }),
        prisma.artist.findMany({ where: { AND: [publicArtistWhere, { id: { in: ids('ARTIST') } }] }, select: artistCardSelect }),
        prisma.gallery.findMany({ where: { AND: [publicGalleryWhere, { id: { in: ids('GALLERY') } }] }, select: galleryCardSelect }),
        prisma.artworkCollection.findMany({ where: { AND: [publicCollectionWhere, { id: { in: ids('COLLECTION') } }] }, select: collectionCardSelect }),
      ]);
      return ok({
        artworks: sortBy(artworks.map(toArtworkCard), 'ARTWORK'),
        artists: sortBy(artists.map(toArtistCard), 'ARTIST'),
        galleries: sortBy(galleries.map(toGalleryCard), 'GALLERY'),
        collections: sortBy(collections.map(toCollectionCard), 'COLLECTION'),
      });
    },
  },
  {
    method: 'GET',
    path: '/wishlist/ids',
    auth: 'required',
    handler: async (ctx) => {
      const items = await prisma.wishlistItem.findMany({
        where: { wishlist: { userId: ctx.user!.id } },
        select: { itemType: true, targetId: true },
      });
      const result: Record<string, string[]> = { ARTWORK: [], ARTIST: [], GALLERY: [], COLLECTION: [] };
      for (const i of items) result[i.itemType].push(i.targetId);
      return ok(result);
    },
  },
  {
    method: 'POST',
    path: '/wishlist',
    auth: 'required',
    handler: async (ctx) => {
      const input = parse(z.object({ itemType: z.enum(ITEM_TYPES), targetId: z.string().min(1).max(40) }), ctx.body);
      await assertTarget(input.itemType, input.targetId);
      const wishlist = await defaultWishlist(ctx.user!.id);
      const existing = await prisma.wishlistItem.findUnique({
        where: { wishlistId_itemType_targetId: { wishlistId: wishlist.id, itemType: input.itemType, targetId: input.targetId } },
      });
      if (!existing) {
        await prisma.$transaction(async (tx) => {
          await tx.wishlistItem.create({
            data: {
              wishlistId: wishlist.id,
              itemType: input.itemType,
              targetId: input.targetId,
              artworkId: input.itemType === 'ARTWORK' ? input.targetId : null,
              artistId: input.itemType === 'ARTIST' ? input.targetId : null,
              galleryId: input.itemType === 'GALLERY' ? input.targetId : null,
              collectionId: input.itemType === 'COLLECTION' ? input.targetId : null,
            },
          });
          if (input.itemType === 'ARTWORK') {
            await tx.artwork.update({ where: { id: input.targetId }, data: { wishlistCount: { increment: 1 } } });
          }
        });
      }
      return created({ itemType: input.itemType, targetId: input.targetId, saved: true });
    },
  },
  {
    method: 'DELETE',
    path: '/wishlist/:itemType/:targetId',
    auth: 'required',
    handler: async (ctx) => {
      const { itemType, targetId } = parse(z.object({ itemType: z.enum(ITEM_TYPES), targetId: z.string().min(1).max(40) }), ctx.params);
      await prisma.$transaction(async (tx) => {
        const { count } = await tx.wishlistItem.deleteMany({ where: { itemType, targetId, wishlist: { userId: ctx.user!.id } } });
        if (count && itemType === 'ARTWORK') {
          await tx.artwork.updateMany({ where: { id: targetId, wishlistCount: { gte: count } }, data: { wishlistCount: { decrement: count } } });
        }
      });
      return ok({ itemType, targetId, saved: false });
    },
  },
];

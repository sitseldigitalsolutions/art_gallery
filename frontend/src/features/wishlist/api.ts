import { del, get, post } from '@/lib/api';
import type { ArtistCard, ArtworkCard, CollectionCard, GalleryCard, WishlistItemType } from '@/lib/types';

export type WishlistIds = Record<WishlistItemType, string[]>;

export const wishlistApi = {
  all: () =>
    get<{ artworks: ArtworkCard[]; artists: ArtistCard[]; galleries: GalleryCard[]; collections: CollectionCard[] }>('/wishlist'),
  ids: () => get<WishlistIds>('/wishlist/ids'),
  add: (itemType: WishlistItemType, targetId: string) => post('/wishlist', { itemType, targetId }),
  remove: (itemType: WishlistItemType, targetId: string) => del(`/wishlist/${itemType}/${targetId}`),
};

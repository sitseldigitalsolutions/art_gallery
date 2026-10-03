import { del, get, getPaged, post } from '@/lib/api';
import type { ArtistCard, ArtistDetail, ArtworkCard, CollectionCard, GalleryCard, Review } from '@/lib/types';

export const artistsApi = {
  list: (params: Record<string, unknown>) => getPaged<ArtistCard>('/artists', params),
  detail: (slug: string) => get<ArtistDetail>(`/artists/${slug}`),
  artworks: (slug: string, params: Record<string, unknown>) => getPaged<ArtworkCard>(`/artists/${slug}/artworks`, params),
  reviews: (artistId: string) => getPaged<Review>(`/reviews/artist/${artistId}`),
  addReview: (artistId: string, body: { rating: number; body?: string }) => post(`/reviews/artist/${artistId}`, body),
  follow: (artistId: string) => post(`/follows/${artistId}`),
  unfollow: (artistId: string) => del(`/follows/${artistId}`),
  following: () => get<ArtistCard[]>('/follows'),
};

export const galleriesApi = {
  list: (params: Record<string, unknown>) => getPaged<GalleryCard>('/galleries', params),
  detail: (slug: string) =>
    get<GalleryCard & { description: string | null; artist: ArtistCard; collections: CollectionCard[]; artworks: ArtworkCard[] }>(
      `/galleries/${slug}`,
    ),
};

export const collectionsApi = {
  list: (params: Record<string, unknown>) => getPaged<CollectionCard>('/collections', params),
  detail: (slug: string) => get<CollectionCard & { artworks: ArtworkCard[] }>(`/collections/${slug}`),
};

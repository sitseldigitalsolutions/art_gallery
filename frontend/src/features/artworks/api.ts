import { get, getPaged, post } from '@/lib/api';
import type { ArtworkCard, ArtworkDetail, HomeData, Ref, Review, TaxonomyItem } from '@/lib/types';

export interface ArtworkFilters {
  q?: string;
  category?: string;
  style?: string;
  medium?: string;
  theme?: string;
  artist?: string;
  gallery?: string;
  color?: string;
  minPrice?: string;
  maxPrice?: string;
  orientation?: string;
  format?: string;
  type?: string;
  size?: string;
  customizable?: string;
  featured?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export type TaxonomyKind = 'categories' | 'styles' | 'mediums' | 'themes';

export const catalogApi = {
  home: () => get<HomeData>('/home'),
  suggest: (q: string) =>
    get<{
      artworks: { slug: string; title: string; thumbnailUrl: string | null }[];
      artists: { slug: string; displayName: string; avatarUrl: string | null }[];
      categories: Ref[];
      styles: Ref[];
    }>('/search/suggest', { params: { q } }),
  taxonomy: (kind: TaxonomyKind, params?: Record<string, unknown>) => get<TaxonomyItem[]>(`/${kind}`, { params }),
  artworks: (filters: ArtworkFilters) => getPaged<ArtworkCard>('/artworks', filters as Record<string, unknown>),
  artwork: (idOrSlug: string) => get<ArtworkDetail>(`/artworks/${idOrSlug}`),
  related: (id: string) => get<{ moreFromArtist: ArtworkCard[]; similar: ArtworkCard[] }>(`/artworks/${id}/related`),
  reviews: (artworkId: string, page = 1) => getPaged<Review>(`/reviews/artwork/${artworkId}`, { page }),
  addReview: (artworkId: string, body: { rating: number; title?: string; body?: string }) =>
    post(`/reviews/artwork/${artworkId}`, body),
  report: (body: { targetType: 'ARTWORK' | 'USER' | 'ARTIST' | 'REVIEW'; targetId: string; reason: string; details?: string }) =>
    post('/reports', body),
};

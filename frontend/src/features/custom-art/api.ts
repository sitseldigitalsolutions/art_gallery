import { get, getPaged, http, patch, post, toFormData } from '@/lib/api';
import type { ArtistCard, CustomArtDetail, CustomArtSummary } from '@/lib/types';

export interface CreateCustomArtInput {
  photos: File[];
  artistId: string;
  styleId: string;
  selectedArtworkId?: string;
  title?: string;
  instructions: string;
  options: Record<string, string>;
  requestedDimensions?: string;
  requestedFormat: 'ORIGINAL' | 'PRINT' | 'DIGITAL';
  budget?: number;
}

const base = '/custom-art/requests';

export const customArtApi = {
  artists: (styleId?: string) => get<ArtistCard[]>('/custom-art/artists', { params: styleId ? { styleId } : undefined }),
  create: async (input: CreateCustomArtInput) => {
    const { photos, ...fields } = input;
    const res = await http.post(base, toFormData(fields as Record<string, unknown>, { photos }));
    return res.data.data as CustomArtDetail;
  },
  list: (params: { as?: 'customer' | 'artist' | 'admin'; status?: string; page?: number }) =>
    getPaged<CustomArtSummary>(base, params),
  detail: (id: string) => get<CustomArtDetail>(`${base}/${id}`),
  review: (id: string) => patch(`${base}/${id}/review`),
  accept: (id: string, body: { quotedPrice: number; artistMessage?: string; dueDate?: string; maxRevisions?: number }) =>
    patch(`${base}/${id}/accept`, body),
  reject: (id: string, reason: string) => patch(`${base}/${id}/reject`, { reason }),
  start: (id: string) => patch(`${base}/${id}/start`),
  uploadPreview: async (id: string, images: File[], message?: string) => {
    const res = await http.post(`${base}/${id}/preview`, toFormData({ message }, { images }));
    return res.data.data;
  },
  revision: (id: string, feedback: string) => post(`${base}/${id}/revision`, { feedback }),
  approve: (id: string, message?: string) => patch(`${base}/${id}/approve`, { message }),
  uploadFinal: async (id: string, images: File[], message?: string) => {
    const res = await http.post(`${base}/${id}/final`, toFormData({ message }, { images }));
    return res.data.data;
  },
  complete: (id: string) => patch(`${base}/${id}/complete`),
  cancel: (id: string, reason: string) => patch(`${base}/${id}/cancel`, { reason }),
};

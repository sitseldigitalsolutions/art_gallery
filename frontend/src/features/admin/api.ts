import { del, downloadFile, get, getPaged, http, patch, post, put } from '@/lib/api';
import type { ArtistMini, Banner, TaxonomyItem } from '@/lib/types';
import type { TaxonomyKind } from '@/features/artworks/api';

export interface AdminDashboard {
  counts: {
    artists: number;
    pendingArtists: number;
    customers: number;
    artworks: number;
    publishedArtworks: number;
    pendingArtworks: number;
    orders: number;
    customRequests: number;
    openReports: number;
  };
  revenue: { gross: number; commission: number; payouts: number };
  recentOrders: Record<string, unknown>[];
  pendingArtists: Record<string, unknown>[];
  pendingArtworks: Record<string, unknown>[];
}

export interface Overview {
  totals: Record<string, number>;
  salesByDay: { date: string; gross: number; commission: number; orders: number }[];
  topStyles: { name: string; count: number }[];
  topCategories: { name: string; count: number }[];
  topArtists: { id: string; displayName: string; gross: number }[];
  trendingArtworks: { id: string; slug: string; title: string; views: number; sales: number }[];
  topCustomStyles: { name: string; count: number }[];
}

// Admin list rows are rendered generically; keep them loosely typed.
export type Row = Record<string, unknown> & { id: string };

export const adminApi = {
  dashboard: () => get<AdminDashboard>('/admin/dashboard'),
  overview: (params: Record<string, unknown>) => get<Overview>('/analytics/overview', { params }),
  exportCsv: (type: string, params: Record<string, unknown>) =>
    downloadFile('/analytics/export', { type, ...params }, `${type}-report.csv`),

  users: (params: Record<string, unknown>) => getPaged<Row>('/admin/users', params),
  userStatus: (id: string, status: string, reason?: string) => patch(`/admin/users/${id}/status`, { status, reason }),
  createUser: (body: Record<string, unknown>) => post<Row>('/admin/users', body),
  deleteUser: (id: string, reason: string) => del<{ id: string; deleted: boolean; cancelledRequests: number }>(`/admin/users/${id}`, { reason }),

  artists: (params: Record<string, unknown>) => getPaged<Row>('/admin/artists', params),
  artist: (id: string) => get<Row>(`/admin/artists/${id}`),
  artistStatus: (id: string, status: string, reason?: string) => patch(`/admin/artists/${id}/status`, { status, reason }),
  artistFeatured: (id: string, isFeatured: boolean) => patch(`/admin/artists/${id}/featured`, { isFeatured }),
  artistCommission: (id: string, percentage: number | null) => patch(`/admin/artists/${id}/commission`, { percentage }),

  artworks: (params: Record<string, unknown>) => getPaged<Row>('/admin/artworks', params),
  moderate: (id: string, action: string, reason?: string) => patch(`/admin/artworks/${id}/moderate`, { action, reason }),
  artworkFeatured: (id: string, isFeatured: boolean) => patch(`/admin/artworks/${id}/featured`, { isFeatured }),

  orders: (params: Record<string, unknown>) => getPaged<Row>('/admin/orders', params),
  order: (id: string) => get<Row>(`/admin/orders/${id}`),
  orderStatus: (id: string, status: string) => patch(`/admin/orders/${id}/status`, { status }),

  payments: (params: Record<string, unknown>) => getPaged<Row>('/admin/payments', params),
  confirmPayment: (id: string, reference?: string) => patch(`/admin/payments/${id}/confirm`, { reference }),
  failPayment: (id: string, reason: string) => patch(`/admin/payments/${id}/fail`, { reason }),

  commissions: () => get<Row[]>('/admin/commissions'),
  createCommission: (body: { scope: string; targetId?: string; percentage: number }) => post('/admin/commissions', body),
  updateCommission: (id: string, body: { percentage?: number; isActive?: boolean }) => patch(`/admin/commissions/${id}`, body),
  deleteCommission: (id: string) => del(`/admin/commissions/${id}`),

  settlements: (params: Record<string, unknown>) => getPaged<Row>('/admin/settlements', params),
  balances: () => get<{ artist: ArtistMini; available: number; pending: number }[]>('/admin/settlements/balances'),
  createSettlement: (body: { artistId: string; method: string; reference?: string; note?: string }) =>
    post('/admin/settlements', body),
  completeSettlement: (id: string, reference: string) => patch(`/admin/settlements/${id}/complete`, { reference }),

  reviews: (params: Record<string, unknown>) => getPaged<Row>('/admin/reviews', params),
  moderateReview: (kind: 'artwork' | 'artist', id: string, status: string) => patch(`/admin/reviews/${kind}/${id}`, { status }),

  reports: (params: Record<string, unknown>) => getPaged<Row>('/admin/reports', params),
  resolveReport: (id: string, status: string, resolution?: string) => patch(`/admin/reports/${id}`, { status, resolution }),

  banners: () => get<(Banner & { placement: string; sortOrder: number; isActive: boolean })[]>('/admin/banners'),
  createBanner: (body: Record<string, unknown>) => post<Banner>('/admin/banners', body),
  updateBanner: (id: string, body: Record<string, unknown>) => patch(`/admin/banners/${id}`, body),
  deleteBanner: (id: string) => del(`/admin/banners/${id}`),
  bannerImage: async (id: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return (await http.post(`/admin/banners/${id}/image`, fd)).data.data;
  },

  settings: () => get<{ key: string; value: unknown; updatedAt?: string }[] | Record<string, unknown>>('/admin/settings'),
  saveSetting: (key: string, value: unknown) => put(`/admin/settings/${key}`, { value }),

  auditLogs: (params: Record<string, unknown>) => getPaged<Row>('/admin/audit-logs', params),

  taxonomy: (kind: TaxonomyKind) => get<TaxonomyItem[]>(`/${kind}`, { params: { all: true } }),
  createTaxonomy: (kind: TaxonomyKind, body: Record<string, unknown>) => post(`/${kind}`, body),
  updateTaxonomy: (kind: TaxonomyKind, id: string, body: Record<string, unknown>) => patch(`/${kind}/${id}`, body),
  deleteTaxonomy: (kind: TaxonomyKind, id: string) => del(`/${kind}/${id}`),
};

import { del, get, getPaged, http, patch, post } from '@/lib/api';
import type { ArtworkDetail, ArtworkStatus, CollectionCard, GalleryCard, Ref } from '@/lib/types';

export interface SellerArtwork extends Omit<ArtworkDetail, 'tags'> {
  tags: Ref[];
  hasDigitalFile?: boolean;
  createdAt?: string;
  updatedAt?: string;
  quantity?: number;
  reserved?: number;
  salesCount?: number;
  wishlistCount?: number;
  collectionIds?: string[];
  approvals?: { toStatus: ArtworkStatus; reason: string | null; createdAt: string }[];
}

export interface ArtworkInput {
  title: string;
  description?: string;
  type: string;
  format: 'ORIGINAL' | 'PRINT' | 'DIGITAL';
  categoryId?: string;
  styleId?: string;
  mediumId?: string;
  themeId?: string;
  tags?: string[];
  yearCreated?: number;
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  orientation?: string;
  dominantColor?: string;
  price: number;
  discountPrice?: number | null;
  quantity?: number;
  isCustomizable?: boolean;
  licenseInfo?: string;
  copyrightInfo?: string;
  collectionIds?: string[];
}

export interface SellerCollection extends CollectionCard {
  isPublished: boolean;
  items: { artworkId: string; title: string; status: string; thumbnailUrl: string | null }[];
}

export interface ArtistMe {
  id: string;
  slug: string;
  displayName: string;
  type: string;
  status: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  acceptsCustomArt: boolean;
  customArtBasePrice: number | null;
  followerCount: number;
  profile: {
    bio: string | null;
    description: string | null;
    artistStatement: string | null;
    yearsOfExperience: number | null;
    website: string | null;
    socialLinks: Record<string, string> | null;
    specializations: string[] | null;
    awards: string[] | null;
  } | null;
  address: { city: string | null; state: string | null; country: string | null; line1: string | null } | null;
  styles: Ref[];
  mediums: Ref[];
  gallery: GalleryCard & { description?: string | null };
  approvals: { toStatus: string; reason: string | null; createdAt: string }[];
}

export interface SellerDashboard {
  status: string;
  counts: { draft: number; pending: number; approved: number; rejected: number; soldOut: number; suspended?: number; total: number };
  followers: number;
  totalSales: number;
  ordersCount: number;
  pendingCustomRequests: number;
  earnings: { gross: number; net: number; pending: number; available: number };
  recentOrders: {
    orderItemId: string;
    orderId: string;
    orderNumber: string;
    orderStatus: string;
    paymentStatus: string;
    title: string;
    image: string | null;
    lineTotal: number;
    artistAmount: number;
    fulfillmentStatus: string;
    createdAt: string;
  }[];
  recentRequests: { id: string; requestNumber: string; status: string; createdAt: string; title: string | null; customerName: string }[];
}

export interface SellerOrder {
  orderId: string;
  orderNumber: string;
  placedAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customer: { fullName: string };
  shippingAddress: Record<string, string> | null;
  items: {
    id: string;
    titleSnapshot: string;
    imageSnapshot: string | null;
    format: string;
    fulfillmentType: string;
    fulfillmentStatus: string;
    quantity: number;
    lineTotal: number;
    artistAmount: number;
  }[];
  shipment: { carrier: string | null; method: string | null; trackingNumber: string | null; packagingInfo: string | null; status: string } | null;
}

export interface Earnings {
  totals: { grossSales: number; commission: number; net: number; pending: number; available: number; settled: number; customArtNet: number };
  monthly: { month: string; gross: number; net: number; orders: number }[];
  ledger: { id: string; type: string; status: string; amount: number; description: string; createdAt: string }[];
  settlements: { id: string; amount: number; status: string; reference: string | null; createdAt: string; completedAt: string | null }[];
}

const upload = async <T,>(url: string, field: string, files: File[]) => {
  const fd = new FormData();
  files.forEach((f) => fd.append(field, f));
  return (await http.post(url, fd)).data.data as T;
};

export const sellerApi = {
  me: () => get<ArtistMe>('/artists/me'),
  updateMe: (body: Record<string, unknown>) => patch<ArtistMe>('/artists/me', body),
  avatar: (file: File) => upload<ArtistMe>('/artists/me/avatar', 'image', [file]),
  cover: (file: File) => upload<ArtistMe>('/artists/me/cover', 'image', [file]),
  updateGallery: (body: Record<string, unknown>) => patch('/galleries/me', body),
  galleryCover: (file: File) => upload('/galleries/me/cover', 'image', [file]),
  dashboard: () => get<SellerDashboard>('/artists/me/dashboard'),
  artworks: (params: Record<string, unknown>) => getPaged<SellerArtwork>('/artists/me/artworks', params),
  artwork: (id: string) => get<SellerArtwork>(`/artists/me/artworks/${id}`),
  createArtwork: (body: ArtworkInput) => post<SellerArtwork>('/artworks', body),
  updateArtwork: (id: string, body: Partial<ArtworkInput>) => patch<SellerArtwork>(`/artworks/${id}`, body),
  archiveArtwork: (id: string) => del(`/artworks/${id}`),
  uploadImages: (id: string, files: File[]) => upload<SellerArtwork>(`/artworks/${id}/images`, 'images', files),
  deleteImage: (id: string, imageId: string) => del(`/artworks/${id}/images/${imageId}`),
  setPrimary: (id: string, imageId: string) => patch(`/artworks/${id}/images/${imageId}/primary`),
  uploadDigital: (id: string, file: File) => upload(`/artworks/${id}/digital-file`, 'file', [file]),
  submit: (id: string) => post(`/artworks/${id}/submit`),
  collections: () => get<SellerCollection[]>('/artists/me/collections'),
  tags: (q: string) => get<Ref[]>('/tags', { params: { q } }),
  createCollection: (body: { name: string; description?: string; isPublished?: boolean; artworkIds?: string[] }) =>
    post<CollectionCard>('/collections', body),
  updateCollection: (id: string, body: Record<string, unknown>) => patch(`/collections/${id}`, body),
  deleteCollection: (id: string) => del(`/collections/${id}`),
  addToCollection: (id: string, artworkId: string) => post(`/collections/${id}/items`, { artworkId }),
  removeFromCollection: (id: string, artworkId: string) => del(`/collections/${id}/items/${artworkId}`),
  collectionCover: (id: string, file: File) => upload(`/collections/${id}/cover`, 'image', [file]),
  orders: (params: Record<string, unknown>) => getPaged<SellerOrder>('/artists/me/orders', params),
  updateShipment: (orderId: string, body: Record<string, unknown>) => patch(`/artists/me/orders/${orderId}/shipment`, body),
  updateFulfillment: (itemId: string, status: string) => patch(`/artists/me/order-items/${itemId}/fulfillment`, { status }),
  earnings: () => get<Earnings>('/artists/me/earnings'),
};

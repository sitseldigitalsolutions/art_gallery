// Types mirroring docs/API_CONTRACT.md

export type Role = 'ADMIN' | 'ARTIST' | 'CUSTOMER';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: Role[];
  artistId: string | null;
  artistStatus: string | null;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paged<T> {
  data: T[];
  meta: PageMeta;
}

export interface Ref {
  id: string;
  name: string;
  slug: string;
}

export interface ArtistMini {
  id: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
}

export type ArtworkFormat = 'ORIGINAL' | 'PRINT' | 'DIGITAL';
export type Orientation = 'PORTRAIT' | 'LANDSCAPE' | 'SQUARE' | 'PANORAMIC';

export const ARTWORK_TYPES = [
  'ORIGINAL_PAINTING',
  'DIGITAL_ART',
  'PRINT',
  'PORTRAIT',
  'ILLUSTRATION',
  'PHOTOGRAPHY',
  'WALL_ART',
  'ABSTRACT',
  'CUSTOM_ART',
  'OTHER',
] as const;
export type ArtworkType = (typeof ARTWORK_TYPES)[number];

export const ARTWORK_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'SOLD_OUT', 'ARCHIVED'] as const;
export type ArtworkStatus = (typeof ARTWORK_STATUSES)[number];

export interface ArtworkCard {
  id: string;
  slug: string;
  title: string;
  type: ArtworkType;
  format: ArtworkFormat;
  status: ArtworkStatus;
  price: number;
  discountPrice: number | null;
  currency: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  orientation: Orientation | null;
  dominantColor: string | null;
  isCustomizable: boolean;
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  available: boolean;
  artist: ArtistMini;
  category: Ref | null;
  style: Ref | null;
  medium: Ref | null;
}

export interface ArtworkImage {
  id: string;
  url: string;
  thumbUrl: string | null;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
  altText: string | null;
}

export interface ArtworkDetail extends Omit<ArtworkCard, 'artist'> {
  description: string | null;
  images: ArtworkImage[];
  theme: Ref | null;
  tags: Ref[];
  yearCreated: number | null;
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
  sku: string;
  licenseInfo: string | null;
  copyrightInfo: string | null;
  availableQuantity: number;
  collections: Ref[];
  artist: ArtistMini & {
    bio: string | null;
    followerCount: number;
    acceptsCustomArt: boolean;
    gallery: { name: string; slug: string } | null;
  };
  isWishlisted: boolean;
  viewCount: number;
  publishedAt: string | null;
}

export interface ArtistCard {
  id: string;
  slug: string;
  displayName: string;
  type: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  followerCount: number;
  artworkCount: number;
  ratingAverage: number;
  ratingCount: number;
  isFeatured: boolean;
  acceptsCustomArt: boolean;
  customArtBasePrice: number | null;
  styles: Ref[];
}

export interface GalleryCard {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  coverImageUrl: string | null;
  artworkCount: number;
  artist: ArtistMini;
}

export interface CollectionCard {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  isFeatured: boolean;
  artworkCount: number;
  previewImages: string[];
  artist: ArtistMini | null;
}

export interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  artworkCount: number;
  availableForCustomArt?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface Testimonial {
  id: string;
  rating: number;
  body: string;
  userName: string;
  artworkTitle: string | null;
  artworkSlug: string | null;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  placement?: string;
}

export interface HomeData {
  banners: Banner[];
  featuredArtworks: ArtworkCard[];
  trendingArtworks: ArtworkCard[];
  newArtworks: ArtworkCard[];
  featuredArtists: ArtistCard[];
  newArtists: ArtistCard[];
  featuredGalleries: GalleryCard[];
  popularCollections: CollectionCard[];
  categories: TaxonomyItem[];
  styles: TaxonomyItem[];
  mediums: TaxonomyItem[];
  themes: TaxonomyItem[];
  testimonials: Testimonial[];
  stats: { artworks: number; artists: number; customers: number; completedCustomArt: number };
  recentlyViewed: ArtworkCard[];
  recommended: ArtworkCard[];
}

export interface ArtistDetail extends ArtistCard {
  profile: {
    description: string | null;
    artistStatement: string | null;
    yearsOfExperience: number | null;
    website: string | null;
    socialLinks: Record<string, string> | null;
    specializations: string[] | null;
    awards: string[] | null;
  } | null;
  mediums: Ref[];
  gallery: GalleryCard | null;
  isFollowing: boolean;
  soldCount: number;
  featuredArtworks: ArtworkCard[];
}

export interface Review {
  id: string;
  rating: number;
  title?: string | null;
  body: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
  user: { fullName: string; avatarUrl?: string | null };
  images?: (string | { url: string })[];
}

export type WishlistItemType = 'ARTWORK' | 'ARTIST' | 'GALLERY' | 'COLLECTION';

export type CustomArtStatus =
  | 'REQUESTED'
  | 'ARTIST_REVIEWING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'PREVIEW_READY'
  | 'REVISION_REQUESTED'
  | 'CUSTOMER_APPROVED'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface CustomArtSummary {
  id: string;
  requestNumber: string;
  status: CustomArtStatus;
  title: string | null;
  requestedFormat: ArtworkFormat;
  budget: number | null;
  quotedPrice: number | null;
  currency: string;
  revisionCount: number;
  maxRevisions: number;
  createdAt: string;
  updatedAt: string;
  artist: ArtistMini;
  customer: { id: string; fullName: string };
  style: Ref | null;
  sourceThumbUrl: string | null;
  latestPreviewUrl: string | null;
  paymentStatus: string | null;
}

export type CustomArtAction =
  | 'review'
  | 'accept'
  | 'reject'
  | 'start'
  | 'preview'
  | 'revision'
  | 'approve'
  | 'addToCart'
  | 'final'
  | 'complete'
  | 'cancel';

export interface CustomArtDetail extends CustomArtSummary {
  instructions: string;
  options: Record<string, string> | null;
  requestedDimensions: string | null;
  artistMessage: string | null;
  customerMessage: string | null;
  dueDate: string | null;
  selectedArtwork: ArtworkCard | null;
  images: { id: string; kind: 'SOURCE' | 'REFERENCE' | 'PREVIEW' | 'FINAL'; url: string; createdAt: string; isAiGenerated: boolean; label?: string | null }[];
  viewerRole?: string;
  revisions: { revisionNumber: number; feedback: string; createdAt: string }[];
  statusHistory: { fromStatus: CustomArtStatus | null; toStatus: CustomArtStatus; actorRole: Role; note: string | null; createdAt: string }[];
  allowedActions: CustomArtAction[];
  order: { id: string; orderNumber: string; paymentStatus: string; status: string } | null;
  inCart: boolean;
}

export interface CartItem {
  id: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  available: boolean;
  artwork: ArtworkCard | null;
  customArt: {
    id: string;
    requestNumber: string;
    title: string | null;
    quotedPrice: number;
    artist: ArtistMini;
    previewUrl: string | null;
  } | null;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  itemCount: number;
  requiresShipping: boolean;
}

export interface PaymentMethodOption {
  method: 'COD' | 'MANUAL';
  label: string;
  description: string;
  available: boolean;
  reason?: string;
}

export interface Address {
  id?: string;
  label?: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  currency: string;
  placedAt: string;
  itemCount: number;
  previewImage: string | null;
}

export interface OrderDetail extends OrderSummary {
  subtotal: number;
  shippingFee: number;
  shippingAddress: Address | null;
  notes: string | null;
  items: {
    id: string;
    titleSnapshot: string;
    imageSnapshot: string | null;
    format: ArtworkFormat;
    fulfillmentType: 'PHYSICAL' | 'DIGITAL';
    fulfillmentStatus: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    artist: ArtistMini;
    artworkSlug: string | null;
    customArtRequestId: string | null;
    canReview: boolean;
  }[];
  shipments: {
    artist: ArtistMini;
    carrier: string | null;
    trackingNumber: string | null;
    status: string;
    shippedAt: string | null;
    deliveredAt: string | null;
  }[];
  payments: { method: string; status: string; amount: number; createdAt: string; instructions?: string | null; providerRef?: string | null }[];
  discountTotal?: number;
  downloads: { id: string; orderItemId: string; title: string; remaining: number; expiresAt: string | null }[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

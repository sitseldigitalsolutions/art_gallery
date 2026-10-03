import type { Prisma } from '@prisma/client';

/** Shared Prisma selects + mappers that produce the shapes documented in docs/API_CONTRACT.md. */

const num = (v: { toString(): string } | null | undefined) => (v === null || v === undefined ? null : Number(v.toString()));

export const refSelect = { id: true, name: true, slug: true } as const;

export const artistMiniSelect = { id: true, slug: true, displayName: true, avatarUrl: true } as const;

export const artworkCardSelect = {
  id: true,
  slug: true,
  title: true,
  type: true,
  format: true,
  status: true,
  price: true,
  discountPrice: true,
  currency: true,
  thumbnailUrl: true,
  previewUrl: true,
  orientation: true,
  dominantColor: true,
  isCustomizable: true,
  isFeatured: true,
  ratingAverage: true,
  ratingCount: true,
  artist: { select: artistMiniSelect },
  category: { select: refSelect },
  style: { select: refSelect },
  medium: { select: refSelect },
  inventory: { select: { quantity: true, reserved: true } },
  images: {
    where: { isPrimary: true },
    take: 1,
    select: { url: true, thumbUrl: true, width: true, height: true },
  },
} satisfies Prisma.ArtworkSelect;

export type ArtworkCardRow = Prisma.ArtworkGetPayload<{ select: typeof artworkCardSelect }>;

export function availableQuantity(a: { format: string; inventory: { quantity: number; reserved: number } | null }) {
  if (a.format === 'DIGITAL') return 9999;
  return Math.max(0, (a.inventory?.quantity ?? 0) - (a.inventory?.reserved ?? 0));
}

export function toArtworkCard(a: ArtworkCardRow) {
  const primary = a.images[0];
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    type: a.type,
    format: a.format,
    status: a.status,
    price: num(a.price)!,
    discountPrice: num(a.discountPrice),
    currency: a.currency,
    imageUrl: primary?.url ?? a.previewUrl ?? a.thumbnailUrl,
    thumbnailUrl: primary?.thumbUrl ?? a.thumbnailUrl ?? primary?.url ?? null,
    imageWidth: primary?.width ?? null,
    imageHeight: primary?.height ?? null,
    orientation: a.orientation,
    dominantColor: a.dominantColor,
    isCustomizable: a.isCustomizable,
    isFeatured: a.isFeatured,
    ratingAverage: num(a.ratingAverage) ?? 0,
    ratingCount: a.ratingCount,
    available: a.status !== 'SOLD_OUT' && availableQuantity(a) > 0,
    artist: a.artist,
    category: a.category,
    style: a.style,
    medium: a.medium,
  };
}

export type ArtworkCard = ReturnType<typeof toArtworkCard>;

/** Public visibility rule for artworks: approved (or sold out) artwork by an approved artist. */
export const publicArtworkWhere: Prisma.ArtworkWhereInput = {
  status: { in: ['APPROVED', 'SOLD_OUT'] },
  artist: { status: 'APPROVED', user: { status: 'ACTIVE' } },
};

export const publicArtistWhere: Prisma.ArtistWhereInput = { status: 'APPROVED', user: { status: 'ACTIVE' } };

export const artistCardSelect = {
  id: true,
  slug: true,
  displayName: true,
  type: true,
  avatarUrl: true,
  coverImageUrl: true,
  followerCount: true,
  ratingAverage: true,
  ratingCount: true,
  isFeatured: true,
  acceptsCustomArt: true,
  customArtBasePrice: true,
  profile: { select: { bio: true } },
  address: { select: { city: true, country: true } },
  styles: { select: refSelect, take: 6 },
  _count: { select: { artworks: { where: { status: { in: ['APPROVED', 'SOLD_OUT'] } } } } },
} satisfies Prisma.ArtistSelect;

export type ArtistCardRow = Prisma.ArtistGetPayload<{ select: typeof artistCardSelect }>;

export function toArtistCard(a: ArtistCardRow) {
  return {
    id: a.id,
    slug: a.slug,
    displayName: a.displayName,
    type: a.type,
    avatarUrl: a.avatarUrl,
    coverImageUrl: a.coverImageUrl,
    bio: a.profile?.bio ?? null,
    city: a.address?.city ?? null,
    country: a.address?.country ?? null,
    followerCount: a.followerCount,
    artworkCount: a._count.artworks,
    ratingAverage: num(a.ratingAverage) ?? 0,
    ratingCount: a.ratingCount,
    isFeatured: a.isFeatured,
    acceptsCustomArt: a.acceptsCustomArt,
    customArtBasePrice: num(a.customArtBasePrice),
    styles: a.styles,
  };
}

export const money = num;

import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { forbidden, notFound } from '../../shared/errors.js';
import type { AuthUser } from '../../shared/http.js';
import { artworkCardSelect, publicArtworkWhere, toArtworkCard } from '../../shared/serializers.js';

/** Public artwork listing filters (query-string driven). Taxonomy/artist/gallery filters use slugs. */
export const artworkFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().max(120).optional(),
  style: z.string().max(120).optional(),
  medium: z.string().max(120).optional(),
  theme: z.string().max(120).optional(),
  artist: z.string().max(120).optional(),
  gallery: z.string().max(120).optional(),
  color: z.string().trim().max(40).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  orientation: z.enum(['PORTRAIT', 'LANDSCAPE', 'SQUARE', 'PANORAMIC']).optional(),
  format: z.enum(['ORIGINAL', 'PRINT', 'DIGITAL']).optional(),
  type: z
    .enum(['ORIGINAL_PAINTING', 'DIGITAL_ART', 'PRINT', 'PORTRAIT', 'ILLUSTRATION', 'PHOTOGRAPHY', 'WALL_ART', 'ABSTRACT', 'CUSTOM_ART', 'OTHER'])
    .optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  customizable: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'trending', 'popular']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});

export type ArtworkFilters = z.infer<typeof artworkFilterSchema>;

export function searchWhere(q: string): Prisma.ArtworkWhereInput {
  return {
    OR: [
      { title: { contains: q } },
      { description: { contains: q } },
      { tags: { some: { tag: { name: { contains: q } } } } },
      { artist: { displayName: { contains: q } } },
      { artist: { gallery: { name: { contains: q } } } },
      { category: { name: { contains: q } } },
      { style: { name: { contains: q } } },
      { medium: { name: { contains: q } } },
    ],
  };
}

export function buildArtworkWhere(f: Partial<ArtworkFilters>): Prisma.ArtworkWhereInput {
  const and: Prisma.ArtworkWhereInput[] = [publicArtworkWhere];
  if (f.q) and.push(searchWhere(f.q));
  if (f.category) and.push({ category: { slug: f.category } });
  if (f.style) and.push({ style: { slug: f.style } });
  if (f.medium) and.push({ medium: { slug: f.medium } });
  if (f.theme) and.push({ theme: { slug: f.theme } });
  if (f.artist) and.push({ artist: { slug: f.artist } });
  if (f.gallery) and.push({ artist: { gallery: { slug: f.gallery } } });
  if (f.color) and.push({ dominantColor: { contains: f.color } });
  if (f.minPrice !== undefined) and.push({ price: { gte: f.minPrice } });
  if (f.maxPrice !== undefined) and.push({ price: { lte: f.maxPrice } });
  if (f.orientation) and.push({ orientation: f.orientation });
  if (f.format) and.push({ format: f.format });
  if (f.type) and.push({ type: f.type });
  if (f.customizable === 'true') and.push({ isCustomizable: true });
  if (f.featured === 'true') and.push({ isFeatured: true });
  if (f.size === 'small') and.push({ widthCm: { lt: 40 }, heightCm: { lt: 40 } });
  if (f.size === 'medium') {
    and.push({ widthCm: { lte: 90 }, heightCm: { lte: 90 } });
    and.push({ OR: [{ widthCm: { gte: 40 } }, { heightCm: { gte: 40 } }] });
  }
  if (f.size === 'large') and.push({ OR: [{ widthCm: { gt: 90 } }, { heightCm: { gt: 90 } }] });
  return { AND: and };
}

export function artworkOrderBy(sort: ArtworkFilters['sort']): Prisma.ArtworkOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ price: 'asc' }, { id: 'asc' }];
    case 'price_desc':
      return [{ price: 'desc' }, { id: 'asc' }];
    case 'trending':
      return [{ salesCount: 'desc' }, { viewCount: 'desc' }, { publishedAt: 'desc' }];
    case 'popular':
      return [{ wishlistCount: 'desc' }, { ratingAverage: 'desc' }, { publishedAt: 'desc' }];
    default:
      return [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
  }
}

export async function findCards(
  where: Prisma.ArtworkWhereInput,
  orderBy: Prisma.ArtworkOrderByWithRelationInput[] = artworkOrderBy('newest'),
  take = 12,
  skip = 0,
) {
  const rows = await prisma.artwork.findMany({ where, orderBy, take, skip, select: artworkCardSelect });
  return rows.map(toArtworkCard);
}

export async function listPublicArtworks(f: ArtworkFilters) {
  const where = buildArtworkWhere(f);
  const [total, data] = await Promise.all([
    prisma.artwork.count({ where }),
    findCards(where, artworkOrderBy(f.sort), f.pageSize, (f.page - 1) * f.pageSize),
  ]);
  return { total, data };
}

/** Resolves the caller's artist identity from the session. Never from the request. */
export function requireArtist(user: AuthUser | null, opts: { approved?: boolean } = {}): string {
  if (!user?.artistId) throw forbidden('An artist account is required');
  const allowed = opts.approved ? ['APPROVED'] : ['APPROVED', 'PENDING_APPROVAL'];
  if (!allowed.includes(user.artistStatus ?? '')) {
    throw forbidden(
      opts.approved ? 'Your artist account must be approved before publishing artwork' : 'Your artist account is not active',
    );
  }
  return user.artistId;
}

/** Loads an artwork owned by the caller; 404 (not 403) for anything else to prevent IDOR enumeration. */
export async function ownedArtwork(user: AuthUser | null, id: string) {
  const artistId = requireArtist(user);
  const artwork = await prisma.artwork.findFirst({ where: { id, artistId } });
  if (!artwork) throw notFound('Artwork');
  return artwork;
}

export async function isWishlisted(userId: string | undefined, itemType: 'ARTWORK' | 'ARTIST' | 'GALLERY' | 'COLLECTION', targetId: string) {
  if (!userId) return false;
  const found = await prisma.wishlistItem.findFirst({ where: { itemType, targetId, wishlist: { userId } }, select: { id: true } });
  return !!found;
}

/** Image rules for artwork uploads. */
export const ARTWORK_IMAGE_RULES = { minWidth: 400, minHeight: 400 };
export const MAX_IMAGES_PER_ARTWORK = 12;

export const thumbKeyFor = (storageKey: string) => storageKey.replace(/\.webp$/, '-thumb.webp');

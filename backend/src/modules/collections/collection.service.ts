import type { Prisma } from '@prisma/client';
import { artistMiniSelect, publicArtistWhere, publicArtworkWhere } from '../../shared/serializers.js';

export const publicCollectionWhere: Prisma.ArtworkCollectionWhereInput = {
  isPublished: true,
  OR: [{ artistId: null }, { artist: publicArtistWhere }],
};

export const collectionCardSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  coverImageUrl: true,
  isFeatured: true,
  isPublished: true,
  artist: { select: artistMiniSelect },
  items: {
    where: { artwork: publicArtworkWhere },
    orderBy: { sortOrder: 'asc' },
    take: 4,
    select: {
      artwork: {
        select: { thumbnailUrl: true, previewUrl: true, images: { where: { isPrimary: true }, take: 1, select: { url: true, thumbUrl: true } } },
      },
    },
  },
  _count: { select: { items: { where: { artwork: publicArtworkWhere } } } },
} satisfies Prisma.ArtworkCollectionSelect;

export type CollectionCardRow = Prisma.ArtworkCollectionGetPayload<{ select: typeof collectionCardSelect }>;

export function toCollectionCard(c: CollectionCardRow) {
  const previewImages = c.items
    .map((i) => i.artwork.thumbnailUrl ?? i.artwork.images[0]?.thumbUrl ?? i.artwork.images[0]?.url ?? i.artwork.previewUrl)
    .filter((u): u is string => !!u);
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    coverImageUrl: c.coverImageUrl ?? c.items[0]?.artwork.previewUrl ?? c.items[0]?.artwork.images[0]?.url ?? null,
    isFeatured: c.isFeatured,
    isPublished: c.isPublished,
    artworkCount: c._count.items,
    previewImages,
    artist: c.artist,
  };
}

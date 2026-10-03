import type { Prisma } from '@prisma/client';
import { artistMiniSelect, publicArtistWhere } from '../../shared/serializers.js';

export const publicGalleryWhere: Prisma.GalleryWhereInput = { artist: publicArtistWhere };

export const galleryCardSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  coverImageUrl: true,
  artist: {
    select: {
      ...artistMiniSelect,
      coverImageUrl: true,
      _count: { select: { artworks: { where: { status: { in: ['APPROVED', 'SOLD_OUT'] } } } } },
    },
  },
} satisfies Prisma.GallerySelect;

export type GalleryCardRow = Prisma.GalleryGetPayload<{ select: typeof galleryCardSelect }>;

export function toGalleryCard(g: GalleryCardRow) {
  return {
    id: g.id,
    slug: g.slug,
    name: g.name,
    tagline: g.tagline,
    coverImageUrl: g.coverImageUrl ?? g.artist.coverImageUrl,
    artworkCount: g.artist._count.artworks,
    artist: { id: g.artist.id, slug: g.artist.slug, displayName: g.artist.displayName, avatarUrl: g.artist.avatarUrl },
  };
}

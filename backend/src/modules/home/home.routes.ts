import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma/client.js';
import { ok, type RouteDef } from '../../shared/http.js';
import {
  artistCardSelect,
  artworkCardSelect,
  publicArtistWhere,
  publicArtworkWhere,
  refSelect,
  toArtistCard,
  toArtworkCard,
} from '../../shared/serializers.js';
import { artworkOrderBy, findCards } from '../artworks/artwork.service.js';
import { collectionCardSelect, publicCollectionWhere, toCollectionCard } from '../collections/collection.service.js';
import { galleryCardSelect, publicGalleryWhere, toGalleryCard } from '../galleries/gallery.service.js';

const activeWindow = (now: Date) => ({
  AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
});

async function taxonomyWithCounts() {
  const include = { _count: { select: { artworks: { where: publicArtworkWhere } } } };
  const orderBy = [{ sortOrder: 'asc' as const }, { name: 'asc' as const }];
  const [categories, styles, mediums, themes] = await Promise.all([
    prisma.artworkCategory.findMany({ where: { isActive: true }, orderBy, include }),
    prisma.artworkStyle.findMany({ where: { isActive: true }, orderBy, include }),
    prisma.artworkMedium.findMany({ where: { isActive: true }, orderBy, include }),
    prisma.artworkTheme.findMany({ where: { isActive: true }, orderBy, include }),
  ]);
  const map = <T extends { _count: { artworks: number } }>(rows: T[]) =>
    rows.map(({ _count, ...r }) => ({ ...r, artworkCount: _count.artworks }));
  return { categories: map(categories), styles: map(styles), mediums: map(mediums), themes: map(themes) };
}

async function featuredArtworks(now: Date) {
  const rows = await prisma.featuredArtwork.findMany({
    where: { placement: 'HOME', artwork: publicArtworkWhere, ...activeWindow(now) },
    orderBy: { sortOrder: 'asc' },
    take: 12,
    select: { artwork: { select: artworkCardSelect } },
  });
  const cards = rows.map((r) => toArtworkCard(r.artwork));
  if (cards.length < 12) {
    const more = await findCards(
      { AND: [publicArtworkWhere, { isFeatured: true }, { id: { notIn: cards.map((c) => c.id) } }] },
      artworkOrderBy('trending'),
      12 - cards.length,
    );
    cards.push(...more);
  }
  return cards;
}

async function featuredArtists(now: Date) {
  const rows = await prisma.featuredArtist.findMany({
    where: { placement: 'HOME', artist: publicArtistWhere, ...activeWindow(now) },
    orderBy: { sortOrder: 'asc' },
    take: 8,
    select: { artist: { select: artistCardSelect } },
  });
  const cards = rows.map((r) => toArtistCard(r.artist));
  if (cards.length < 8) {
    const more = await prisma.artist.findMany({
      where: { AND: [publicArtistWhere, { isFeatured: true }, { id: { notIn: cards.map((c) => c.id) } }] },
      orderBy: { followerCount: 'desc' },
      take: 8 - cards.length,
      select: artistCardSelect,
    });
    cards.push(...more.map(toArtistCard));
  }
  return cards;
}

async function testimonials() {
  const [artworkReviews, artistReviews] = await Promise.all([
    prisma.artworkReview.findMany({
      where: { status: 'APPROVED', rating: { gte: 4 }, body: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, rating: true, body: true, createdAt: true, user: { select: { fullName: true } }, artwork: { select: { title: true, slug: true } } },
    }),
    prisma.artistReview.findMany({
      where: { status: 'APPROVED', rating: { gte: 4 }, body: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, rating: true, body: true, createdAt: true, user: { select: { fullName: true } }, artist: { select: { displayName: true } } },
    }),
  ]);
  return [
    ...artworkReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      userName: r.user.fullName,
      artworkTitle: r.artwork.title,
      artworkSlug: r.artwork.slug,
      createdAt: r.createdAt,
    })),
    ...artistReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      userName: r.user.fullName,
      artworkTitle: r.artist.displayName,
      artworkSlug: null,
      createdAt: r.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);
}

/** Personalised picks: public artworks sharing styles/categories with what the user viewed or saved. */
export async function recommendedFor(userId: string, take = 12) {
  const [viewed, saved] = await Promise.all([
    prisma.recentlyViewedArtwork.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: 30,
      select: { artwork: { select: { id: true, styleId: true, categoryId: true } } },
    }),
    prisma.wishlistItem.findMany({
      where: { wishlist: { userId }, itemType: 'ARTWORK' },
      take: 30,
      select: { artwork: { select: { id: true, styleId: true, categoryId: true } } },
    }),
  ]);
  const seeds = [...viewed.map((v) => v.artwork), ...saved.map((s) => s.artwork)].filter(Boolean) as Array<{
    id: string;
    styleId: string | null;
    categoryId: string | null;
  }>;
  const exclude = seeds.map((s) => s.id);
  const styleIds = [...new Set(seeds.map((s) => s.styleId).filter((x): x is string => !!x))];
  const categoryIds = [...new Set(seeds.map((s) => s.categoryId).filter((x): x is string => !!x))];
  const or: Prisma.ArtworkWhereInput[] = [];
  if (styleIds.length) or.push({ styleId: { in: styleIds } });
  if (categoryIds.length) or.push({ categoryId: { in: categoryIds } });
  const picks = or.length
    ? await findCards({ AND: [publicArtworkWhere, { id: { notIn: exclude } }, { OR: or }] }, artworkOrderBy('trending'), take)
    : [];
  if (picks.length < take) {
    picks.push(
      ...(await findCards(
        { AND: [publicArtworkWhere, { id: { notIn: [...exclude, ...picks.map((p) => p.id)] } }] },
        artworkOrderBy('trending'),
        take - picks.length,
      )),
    );
  }
  return picks;
}

export async function recentlyViewedFor(userId: string, take = 12) {
  const rows = await prisma.recentlyViewedArtwork.findMany({
    where: { userId, artwork: publicArtworkWhere },
    orderBy: { viewedAt: 'desc' },
    take,
    select: { artwork: { select: artworkCardSelect } },
  });
  return rows.map((r) => toArtworkCard(r.artwork));
}

export const homeRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/home',
    auth: 'optional',
    handler: async (ctx) => {
      const now = new Date();
      const [
        banners,
        featured,
        trendingArtworks,
        newArtworks,
        artists,
        newArtists,
        galleries,
        collections,
        taxonomy,
        reviews,
        stats,
      ] = await Promise.all([
        prisma.banner.findMany({
          where: { isActive: true, ...activeWindow(now) },
          orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }],
          select: { id: true, title: true, subtitle: true, imageUrl: true, linkUrl: true, placement: true },
        }),
        featuredArtworks(now),
        findCards(publicArtworkWhere, artworkOrderBy('trending'), 12),
        findCards(publicArtworkWhere, artworkOrderBy('newest'), 12),
        featuredArtists(now),
        prisma.artist.findMany({ where: publicArtistWhere, orderBy: { createdAt: 'desc' }, take: 8, select: artistCardSelect }),
        prisma.gallery.findMany({
          where: publicGalleryWhere,
          orderBy: [{ isFeatured: 'desc' }, { artist: { followerCount: 'desc' } }],
          take: 6,
          select: galleryCardSelect,
        }),
        prisma.artworkCollection.findMany({
          where: { AND: [publicCollectionWhere, { items: { some: { artwork: publicArtworkWhere } } }] },
          orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
          take: 8,
          select: collectionCardSelect,
        }),
        taxonomyWithCounts(),
        testimonials(),
        Promise.all([
          prisma.artwork.count({ where: publicArtworkWhere }),
          prisma.artist.count({ where: publicArtistWhere }),
          prisma.user.count({ where: { status: 'ACTIVE', roles: { some: { role: { name: 'CUSTOMER' } } }, artist: null } }),
          prisma.customArtRequest.count({ where: { status: 'COMPLETED' } }),
        ]),
      ]);
      const [recentlyViewed, recommended] = ctx.user
        ? await Promise.all([recentlyViewedFor(ctx.user.id), recommendedFor(ctx.user.id)])
        : [[], []];
      return ok({
        banners,
        featuredArtworks: featured,
        trendingArtworks,
        newArtworks,
        featuredArtists: artists,
        newArtists: newArtists.map(toArtistCard),
        featuredGalleries: galleries.map(toGalleryCard),
        popularCollections: collections.map(toCollectionCard),
        ...taxonomy,
        testimonials: reviews,
        stats: { artworks: stats[0], artists: stats[1], customers: stats[2], completedCustomArt: stats[3] },
        recentlyViewed,
        recommended,
      });
    },
  },
  {
    method: 'GET',
    path: '/search/suggest',
    handler: async (ctx) => {
      const q = typeof ctx.query.q === 'string' ? ctx.query.q.trim().slice(0, 80) : '';
      if (q.length < 2) return ok({ artworks: [], artists: [], categories: [], styles: [] });
      const [artworks, artists, categories, styles] = await Promise.all([
        prisma.artwork.findMany({
          where: { AND: [publicArtworkWhere, { OR: [{ title: { contains: q } }, { tags: { some: { tag: { name: { contains: q } } } } }] }] },
          orderBy: [{ salesCount: 'desc' }, { viewCount: 'desc' }],
          take: 6,
          select: { slug: true, title: true, thumbnailUrl: true },
        }),
        prisma.artist.findMany({
          where: { AND: [publicArtistWhere, { OR: [{ displayName: { contains: q } }, { gallery: { name: { contains: q } } }] }] },
          orderBy: { followerCount: 'desc' },
          take: 5,
          select: { slug: true, displayName: true, avatarUrl: true },
        }),
        prisma.artworkCategory.findMany({ where: { isActive: true, name: { contains: q } }, take: 4, select: refSelect }),
        prisma.artworkStyle.findMany({ where: { isActive: true, name: { contains: q } }, take: 4, select: refSelect }),
      ]);
      return ok({ artworks, artists, categories, styles });
    },
  },
];

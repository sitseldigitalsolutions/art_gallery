import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { catalogApi } from '@/features/artworks/api';
import { useSiteConfig } from '@/features/site/SiteConfigContext';
import { ErrorState, GridSkeleton } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import type { HomeSectionConfig, HomeSectionId } from '@/lib/siteConfig';
import type { HomeData } from '@/lib/types';
import { FilterCard, Hero } from './Hero';
import {
  ArtistsSection,
  ArtworkCarousel,
  ArtworkRow,
  CategoryMosaic,
  CollectionsSection,
  PerfectArtBand,
  PhotoToArt,
  StylesRow,
  Testimonials,
  TrendingSection,
} from './sections';

/** Trim to whole rows of 4 so 4-column grids never end with a half-empty row. */
const fullRows = <T,>(items: T[]) => (items.length > 4 ? items.slice(0, items.length - (items.length % 4)) : items);

type Renderer = (d: HomeData, s: HomeSectionConfig, ctx: { overlap: boolean }) => ReactNode;

/** One renderer per configurable homepage section (order and visibility come from the admin site config). */
const SECTIONS: Record<HomeSectionId, Renderer> = {
  filterCard: (d, s, { overlap }) => (
    <FilterCard categories={d.categories} styles={d.styles} mediums={d.mediums} overlap={overlap} title={s.title || undefined} />
  ),
  categories: (d, s) => (
    <CategoryMosaic
      categories={d.categories}
      fallbackImages={d.featuredArtworks.map((a) => a.imageUrl ?? '').filter(Boolean)}
      title={s.title}
      subtitle={s.subtitle}
    />
  ),
  featured: (d, s) => (
    <ArtworkCarousel
      title={s.title || `Best of ${new Date().getFullYear()}`}
      subtitle={s.subtitle || 'Hand-picked by our curators — the works that moved us most this year.'}
      artworks={d.featuredArtworks.length ? d.featuredArtworks : d.newArtworks}
      to="/gallery?featured=true"
    />
  ),
  perfectArt: (d, s) => (
    <PerfectArtBand artwork={d.trendingArtworks[0] ?? d.featuredArtworks[0]} stats={d.stats} title={s.title} subtitle={s.subtitle} />
  ),
  styles: (d, s) => <StylesRow styles={d.styles} title={s.title} subtitle={s.subtitle} />,
  photoToArt: (d, s) => <PhotoToArt styles={d.styles} title={s.title} subtitle={s.subtitle} />,
  trending: (d, s) => <TrendingSection artworks={d.trendingArtworks} title={s.title} subtitle={s.subtitle} />,
  recommended: (d, s) => <ArtworkRow title={s.title || 'Recommended for you'} subtitle={s.subtitle} artworks={d.recommended} />,
  collections: (d, s) => <CollectionsSection collections={fullRows(d.popularCollections)} title={s.title} subtitle={s.subtitle} />,
  artists: (d, s) => (
    <ArtistsSection
      title={s.title || 'Artists'}
      subtitle={s.subtitle}
      artists={fullRows(d.featuredArtists.length ? d.featuredArtists : d.newArtists)}
    />
  ),
  newArrivals: (d, s) => (
    <ArtworkCarousel title={s.title || 'New Arrivals'} subtitle={s.subtitle} artworks={d.newArtworks} to="/gallery?sort=newest" />
  ),
  // Only distinct from "artists" when there are featured artists to show there.
  newArtists: (d, s) =>
    d.featuredArtists.length > 0 && d.newArtists.length > 0 ? (
      <ArtistsSection title={s.title || 'New Artists'} subtitle={s.subtitle} artists={fullRows(d.newArtists)} />
    ) : null,
  recentlyViewed: (d, s) => <ArtworkRow title={s.title || 'Recently viewed'} subtitle={s.subtitle} artworks={d.recentlyViewed} />,
  testimonials: (d, s) => <Testimonials items={d.testimonials} title={s.title} subtitle={s.subtitle} />,
};

export default function HomePage() {
  const home = useQuery({ queryKey: ['home'], queryFn: catalogApi.home });
  const { config } = useSiteConfig();
  const d = home.data;
  const sections = config.homeSections.filter((s) => s.enabled);
  // The filter card overlaps the hero only when it is the first visible block right after it.
  const overlap = config.hero.enabled && sections[0]?.id === 'filterCard';

  return (
    <>
      {config.hero.enabled ? <Hero banners={d?.banners} overlapCard={overlap} /> : <div className="h-20 bg-ink" aria-hidden />}

      {home.isLoading && (
        <div className="container-x space-y-10 py-20">
          <GridSkeleton count={5} className="h-56" />
          <GridSkeleton count={4} />
        </div>
      )}
      {home.isError && (
        <div className="container-x py-20">
          <ErrorState message={errorMessage(home.error)} onRetry={() => home.refetch()} />
        </div>
      )}

      {d &&
        sections.map((s, i) => (
          <div key={s.id} data-section={s.id}>
            {SECTIONS[s.id](d, s, { overlap: i === 0 && overlap })}
          </div>
        ))}
    </>
  );
}

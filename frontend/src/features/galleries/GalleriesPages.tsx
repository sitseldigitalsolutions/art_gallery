import { plural } from '@/lib/format';
import { mediaVariant } from '@/lib/media';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArtworkMasonry, Avatar, CollectionTile, GalleryTile, HeartButton } from '@/components/cards';
import { EmptyState, ErrorState, GridSkeleton, PageHero, Pagination, Reveal } from '@/components/ui';
import { collectionsApi, galleriesApi } from '@/features/artists/api';
import { catalogApi } from '@/features/artworks/api';
import { errorMessage } from '@/lib/api';

export function GalleriesPage() {
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['galleries', page], queryFn: () => galleriesApi.list({ page, pageSize: 12 }) });
  return (
    <>
      <PageHero title="Galleries" subtitle="Step inside the online rooms of our artists and studios." />
      <div className="container-x py-12">
        {q.isLoading && <GridSkeleton count={6} />}
        {q.isError && <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />}
        {q.data?.data.length === 0 && <EmptyState title="No galleries yet" />}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {q.data?.data.map((g, i) => (
            <Reveal key={g.id} delay={(i % 3) * 0.08}>
              <GalleryTile gallery={g} />
            </Reveal>
          ))}
        </div>
        {q.data && <Pagination page={page} totalPages={q.data.meta.totalPages} onChange={setPage} />}
      </div>
    </>
  );
}

export function GalleryDetailPage() {
  const { slug = '' } = useParams();
  const q = useQuery({ queryKey: ['gallery', slug], queryFn: () => galleriesApi.detail(slug) });
  const g = q.data;
  if (q.isError)
    return (
      <div className="container-x pb-20 pt-28">
        <ErrorState message={errorMessage(q.error, 'Gallery not found')} />
      </div>
    );
  return (
    <>
      <PageHero title={g?.name ?? 'Gallery'} subtitle={g?.tagline ?? undefined} image={g?.coverImageUrl} />
      {g && (
        <div className="container-x py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <Link to={`/artists/${g.artist.slug}`} className="flex items-center gap-4">
              <Avatar src={g.artist.avatarUrl} name={g.artist.displayName} size={56} />
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">Curated by</p>
                <p className="font-semibold">{g.artist.displayName}</p>
              </div>
            </Link>
            <HeartButton type="GALLERY" id={g.id} light className="border border-gray-200" />
          </div>
          {g.description && <p className="mt-8 max-w-3xl whitespace-pre-line leading-relaxed text-gray-600">{g.description}</p>}
          {g.collections.length > 0 && (
            <>
              <h2 className="section-title mb-6 mt-14">Collections</h2>
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                {g.collections.map((c) => (
                  <CollectionTile key={c.id} collection={c} />
                ))}
              </div>
            </>
          )}
          <h2 className="section-title mb-6 mt-14">On display</h2>
          {g.artworks.length === 0 ? <EmptyState title="No artworks on display yet" /> : <ArtworkMasonry artworks={g.artworks} />}
        </div>
      )}
    </>
  );
}

export function CollectionsPage() {
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['collections', page], queryFn: () => collectionsApi.list({ page, pageSize: 16 }) });
  return (
    <>
      <PageHero title="Collections" subtitle="Curated series — Indian heritage, modern abstracts, emotional portraits and more." />
      <div className="container-x py-12">
        {q.isLoading && <GridSkeleton count={8} />}
        {q.isError && <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />}
        {q.data?.data.length === 0 && <EmptyState title="No collections yet" />}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {q.data?.data.map((c, i) => (
            <Reveal key={c.id} delay={(i % 4) * 0.06}>
              <CollectionTile collection={c} />
            </Reveal>
          ))}
        </div>
        {q.data && <Pagination page={page} totalPages={q.data.meta.totalPages} onChange={setPage} />}
      </div>
    </>
  );
}

export function CollectionDetailPage() {
  const { slug = '' } = useParams();
  const q = useQuery({ queryKey: ['collection', slug], queryFn: () => collectionsApi.detail(slug) });
  const c = q.data;
  if (q.isError)
    return (
      <div className="container-x pb-20 pt-28">
        <ErrorState message={errorMessage(q.error, 'Collection not found')} />
      </div>
    );
  return (
    <>
      <PageHero title={c?.name ?? 'Collection'} subtitle={c?.description ?? undefined} image={c?.coverImageUrl ?? c?.previewImages[0]} />
      {c && (
        <div className="container-x py-12">
          <div className="mb-8 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {plural(c.artworkCount, 'artwork')} ·{' '}
              {c.artist ? (
                <Link className="font-semibold text-ink hover:text-brand" to={`/artists/${c.artist.slug}`}>
                  {c.artist.displayName}
                </Link>
              ) : (
                'Curated by MyMoons Gallery'
              )}
            </p>
            <HeartButton type="COLLECTION" id={c.id} light className="border border-gray-200" />
          </div>
          {c.artworks.length === 0 ? <EmptyState title="This collection is empty" /> : <ArtworkMasonry artworks={c.artworks} />}
        </div>
      )}
    </>
  );
}

export function CategoriesPage() {
  const q = useQuery({ queryKey: ['taxonomy', 'categories'], queryFn: () => catalogApi.taxonomy('categories') });
  return (
    <>
      <PageHero title="Categories" subtitle="Every kind of art, from calligraphy to sculpture." />
      <div className="container-x py-12">
        {q.isLoading && <GridSkeleton count={9} className="h-60" />}
        {q.isError && <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />}
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          {q.data?.map((c, i) => (
            <Reveal key={c.id} delay={(i % 3) * 0.06}>
              <Link to={`/gallery?category=${c.slug}`} className="group relative block h-60 overflow-hidden rounded-2xl">
                {c.imageUrl ? (
                  <img
                    src={mediaVariant(c.imageUrl, 'md') ?? undefined}
                    alt={c.name}
                    loading="lazy"
                    decoding="async" onError={(e) => { const img = e.currentTarget; if (!img.dataset.fallback) { img.dataset.fallback = '1'; img.src = c.imageUrl!; } }}
                    className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110"
                  />
                ) : (
                  <div className="hero-fallback h-full w-full" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                <div className="absolute bottom-0 p-5 text-white">
                  <h3 className="text-xl font-semibold">{c.name}</h3>
                  <p className="text-xs text-white/70">{plural(c.artworkCount, 'artwork')}</p>
                  {c.description && <p className="mt-1 line-clamp-2 text-xs text-white/60">{c.description}</p>}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}

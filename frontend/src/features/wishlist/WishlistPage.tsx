import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArtistPortrait, ArtworkMasonry, CollectionTile, GalleryTile } from '@/components/cards';
import { EmptyState, ErrorState, GridSkeleton } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { wishlistApi } from './api';

type Tab = 'artworks' | 'artists' | 'galleries' | 'collections';

export default function WishlistPage() {
  const [tab, setTab] = useState<Tab>('artworks');
  const q = useQuery({ queryKey: ['wishlist', 'all'], queryFn: wishlistApi.all });
  const d = q.data;
  const counts: Record<Tab, number> = {
    artworks: d?.artworks.length ?? 0,
    artists: d?.artists.length ?? 0,
    galleries: d?.galleries.length ?? 0,
    collections: d?.collections.length ?? 0,
  };
  return (
    <div>
      <h1 className="text-2xl font-semibold">Wishlist</h1>
      <div role="tablist" className="my-6 flex gap-2 overflow-x-auto">
        {(Object.keys(counts) as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={clsx('chip capitalize', tab === t && 'chip-active')}>
            {t} ({counts[t]})
          </button>
        ))}
      </div>
      {q.isLoading && <GridSkeleton count={6} />}
      {q.isError && <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />}
      {d && counts[tab] === 0 && (
        <EmptyState
          title={`No saved ${tab} yet`}
          message="Tap the heart on anything you love to keep it here."
          action={
            <Link to="/gallery" className="btn-brand">
              Explore Gallery
            </Link>
          }
        />
      )}
      {d && tab === 'artworks' && <ArtworkMasonry artworks={d.artworks} />}
      {d && tab === 'artists' && (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          {d.artists.map((a) => (
            <ArtistPortrait key={a.id} artist={a} />
          ))}
        </div>
      )}
      {d && tab === 'galleries' && (
        <div className="grid gap-5 md:grid-cols-2">
          {d.galleries.map((g) => (
            <GalleryTile key={g.id} gallery={g} />
          ))}
        </div>
      )}
      {d && tab === 'collections' && (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          {d.collections.map((c) => (
            <CollectionTile key={c.id} collection={c} />
          ))}
        </div>
      )}
    </div>
  );
}

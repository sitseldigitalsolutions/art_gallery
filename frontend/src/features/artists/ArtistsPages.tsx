import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Award, Globe, MapPin, Search, Sparkles, UserCheck, UserPlus } from 'lucide-react';
import { ArtistPortrait, ArtworkMasonry, Avatar, HeartButton } from '@/components/cards';
import { EmptyState, ErrorState, GridSkeleton, PageHero, Pagination, Reveal, Skeleton, Stars } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { catalogApi } from '@/features/artworks/api';
import { errorMessage } from '@/lib/api';
import { compact, date, plural } from '@/lib/format';
import { artistsApi } from './api';

export function ArtistsPage() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const [q, setQ] = useState(params.get('q') ?? '');
  const styles = useQuery({ queryKey: ['taxonomy', 'styles'], queryFn: () => catalogApi.taxonomy('styles'), staleTime: 600_000 });
  const filters = { q: params.get('q') ?? undefined, style: params.get('style') ?? undefined, customArt: params.get('customArt') ?? undefined, sort: params.get('sort') ?? 'popular', page, pageSize: 16 };
  const list = useQuery({ queryKey: ['artists', filters], queryFn: () => artistsApi.list(filters) });

  const update = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHero title="Artists" subtitle="Meet the painters, illustrators, photographers and studios behind every piece." />
      <div className="container-x py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center">
          <form
            className="flex flex-1 items-center rounded-full border border-gray-200 p-1 pl-4"
            onSubmit={(e) => {
              e.preventDefault();
              update('q', q.trim() || null);
            }}
          >
            <Search size={16} className="text-gray-400" />
            <input aria-label="Search artists" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none" placeholder="Search artists or galleries" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn-brand !py-2">Search</button>
          </form>
          <select aria-label="Style" className="input lg:!w-48" value={filters.style ?? ''} onChange={(e) => update('style', e.target.value || null)}>
            <option value="">All styles</option>
            {styles.data?.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <select aria-label="Sort" className="input lg:!w-44" value={filters.sort} onChange={(e) => update('sort', e.target.value)}>
            <option value="popular">Most followed</option>
            <option value="newest">Newest</option>
            <option value="rating">Top rated</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-brand" checked={filters.customArt === 'true'} onChange={(e) => update('customArt', e.target.checked ? 'true' : null)} />
            Accepts custom art
          </label>
        </div>
        {list.isLoading && <GridSkeleton count={8} className="h-80" />}
        {list.isError && <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />}
        {list.data?.data.length === 0 && <EmptyState title="No artists found" message="Try a different search or style." />}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {list.data?.data.map((a, i) => (
            <Reveal key={a.id} delay={(i % 4) * 0.06}>
              <ArtistPortrait artist={a} />
            </Reveal>
          ))}
        </div>
        {list.data && <Pagination page={page} totalPages={list.data.meta.totalPages} onChange={(p) => update('page', String(p))} />}
      </div>
    </>
  );
}

type Tab = 'artworks' | 'sold' | 'about' | 'reviews';

export function ArtistDetailPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('artworks');
  const [page, setPage] = useState(1);
  const artist = useQuery({ queryKey: ['artist', slug], queryFn: () => artistsApi.detail(slug) });
  const a = artist.data;
  const works = useQuery({
    queryKey: ['artist', slug, 'artworks', tab, page],
    queryFn: () => artistsApi.artworks(slug, { page, pageSize: 24, sold: tab === 'sold' ? 'true' : undefined }),
    enabled: tab === 'artworks' || tab === 'sold',
  });
  const reviews = useQuery({ queryKey: ['artist', a?.id, 'reviews'], queryFn: () => artistsApi.reviews(a!.id), enabled: !!a && tab === 'reviews' });

  const follow = useMutation({
    mutationFn: () => (a!.isFollowing ? artistsApi.unfollow(a!.id) : artistsApi.follow(a!.id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['artist', slug] }),
  });

  if (artist.isLoading)
    return (
      <div className="pt-20">
        <Skeleton className="h-80 rounded-none" />
      </div>
    );
  if (artist.isError || !a)
    return (
      <div className="container-x pb-20 pt-28">
        <ErrorState message={errorMessage(artist.error, 'Artist not found')} />
      </div>
    );

  return (
    <>
      <section className="relative h-[420px] overflow-hidden bg-ink">
        {a.coverImageUrl ? (
          <motion.img initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 1.6 }} src={a.coverImageUrl} alt="" className="h-full w-full object-cover opacity-70" />
        ) : (
          <div className="hero-fallback h-full w-full opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
      </section>
      <div className="container-x relative -mt-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-full bg-white p-1.5 shadow-xl">
            <Avatar src={a.avatarUrl} name={a.displayName} size={140} />
          </motion.div>
          <div className="flex-1 pb-2 md:text-white">
            <h1 className="font-serif text-4xl font-medium text-ink md:text-white">{a.displayName}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 md:text-white/70">
              {a.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {a.city}
                  {a.country ? `, ${a.country}` : ''}
                </span>
              )}
              <span>{compact(a.followerCount)} followers</span>
              <span>{plural(a.artworkCount, 'artwork')}</span>
              <span>{a.soldCount} sold</span>
              {a.ratingCount > 0 && (
                <span className="flex items-center gap-1">
                  <Stars value={a.ratingAverage} size={12} /> {a.ratingAverage.toFixed(1)}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pb-2">
            <button
              className={a.isFollowing ? 'btn-outline bg-white' : 'btn-brand'}
              disabled={follow.isPending}
              onClick={() => (user ? follow.mutate() : navigate(`/login?next=/artists/${slug}`))}
            >
              {a.isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />} {a.isFollowing ? 'Following' : 'Follow'}
            </button>
            {a.acceptsCustomArt && (
              <Link to={`/create-your-art?artist=${a.id}`} className="btn-brand bg-gradient-to-r from-brand to-magenta">
                <Sparkles size={16} /> Request custom art
              </Link>
            )}
            <HeartButton type="ARTIST" id={a.id} light className="!h-11 !w-11 border border-gray-200" />
          </div>
        </div>

        {a.bio && <p className="mt-8 max-w-3xl font-serif text-xl italic leading-relaxed text-gray-700">“{a.bio}”</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {a.styles.map((s) => (
            <Link key={s.id} to={`/gallery?style=${s.slug}`} className="chip">
              {s.name}
            </Link>
          ))}
          {a.mediums.map((m) => (
            <Link key={m.id} to={`/gallery?medium=${m.slug}`} className="chip">
              {m.name}
            </Link>
          ))}
        </div>

        <div role="tablist" className="mt-10 flex gap-6 overflow-x-auto border-b border-gray-100">
          {(['artworks', 'sold', 'about', 'reviews'] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setPage(1);
              }}
              className={clsx('relative pb-3 text-sm font-semibold capitalize', tab === t ? 'text-ink' : 'text-gray-400 hover:text-ink')}
            >
              {t === 'sold' ? 'Sold' : t}
              {tab === t && <motion.span layoutId="artist-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-brand" />}
            </button>
          ))}
        </div>

        <div className="py-10">
          {(tab === 'artworks' || tab === 'sold') && (
            <>
              {works.isLoading && <GridSkeleton count={8} className="h-72" />}
              {works.data?.data.length === 0 && <EmptyState title={tab === 'sold' ? 'Nothing sold yet' : 'No artworks published yet'} />}
              {works.data && <ArtworkMasonry artworks={works.data.data} />}
              {works.data && <Pagination page={page} totalPages={works.data.meta.totalPages} onChange={setPage} />}
            </>
          )}
          {tab === 'about' && (
            <div className="grid gap-10 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {a.profile?.description && <p className="whitespace-pre-line leading-relaxed text-gray-700">{a.profile.description}</p>}
                {a.profile?.artistStatement && (
                  <div className="rounded-3xl bg-brand-light p-6">
                    <h3 className="mb-2 font-semibold text-brand">Artist statement</h3>
                    <p className="whitespace-pre-line font-serif italic leading-relaxed text-gray-700">{a.profile.artistStatement}</p>
                  </div>
                )}
                {!a.profile?.description && !a.profile?.artistStatement && <p className="text-gray-500">This artist hasn’t written their story yet.</p>}
              </div>
              <aside className="card space-y-4 p-6 text-sm">
                {a.profile?.yearsOfExperience != null && (
                  <p>
                    <span className="font-semibold">{a.profile.yearsOfExperience}</span> years of experience
                  </p>
                )}
                {!!a.profile?.specializations?.length && (
                  <div>
                    <p className="label">Specializations</p>
                    <p>{a.profile.specializations.join(', ')}</p>
                  </div>
                )}
                {!!a.profile?.awards?.length && (
                  <div>
                    <p className="label">Awards</p>
                    <ul className="space-y-1">
                      {a.profile.awards.map((w) => (
                        <li key={w} className="flex gap-2">
                          <Award size={14} className="mt-0.5 shrink-0 text-amber-500" /> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {a.profile?.website && (
                  <a href={a.profile.website} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 text-brand hover:underline">
                    <Globe size={14} /> Website
                  </a>
                )}
                {a.profile?.socialLinks &&
                  Object.entries(a.profile.socialLinks).map(([k, v]) => (
                    <a key={k} href={v} target="_blank" rel="noreferrer noopener" className="block capitalize text-brand hover:underline">
                      {k}
                    </a>
                  ))}
                {a.gallery && (
                  <Link to={`/galleries/${a.gallery.slug}`} className="btn-outline w-full">
                    Visit {a.gallery.name}
                  </Link>
                )}
              </aside>
            </div>
          )}
          {tab === 'reviews' && (
            <div className="max-w-3xl space-y-4">
              {reviews.data?.data.length === 0 && <EmptyState title="No reviews yet" />}
              {reviews.data?.data.map((r) => (
                <div key={r.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{r.user.fullName}</p>
                    <Stars value={r.rating} />
                  </div>
                  {r.body && <p className="mt-2 text-sm text-gray-600">{r.body}</p>}
                  <p className="mt-2 text-xs text-gray-400">{date(r.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

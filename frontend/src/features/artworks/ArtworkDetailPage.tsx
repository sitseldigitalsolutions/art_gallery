import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { clsx } from 'clsx';
import { useState, type MouseEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, Expand, Flag, Ruler, ShoppingBag, Sparkles, X, Zap } from 'lucide-react';
import { Avatar, ArtworkTile, HeartButton, PriceTag } from '@/components/cards';
import { ErrorState, Reveal, Skeleton, Stars } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { cartApi } from '@/features/cart/api';
import { errorMessage } from '@/lib/api';
import { date, humanize } from '@/lib/format';
import type { ArtworkDetail } from '@/lib/types';
import { catalogApi } from './api';

/** Render bare URLs in credit text as short "source" links instead of long unbreakable strings. */
function linkify(text: string) {
  return text.split(/(https?:\/\/[^\s)]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow" className="text-brand underline">
        source
      </a>
    ) : (
      part
    ),
  );
}

function ZoomImage({ src, alt, onOpen }: { src: string | null; alt: string; onOpen: () => void }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  return (
    <div
      className="group relative cursor-zoom-in overflow-hidden rounded-3xl bg-gray-50 shadow-[0_30px_80px_-30px_rgba(11,10,18,.5)]"
      onMouseMove={onMove}
      onMouseLeave={() => setPos(null)}
      onClick={onOpen}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="max-h-[78vh] w-full object-contain transition-transform duration-200"
          style={pos ? { transform: 'scale(2)', transformOrigin: `${pos.x}% ${pos.y}%` } : undefined}
        />
      ) : (
        <div className="hero-fallback aspect-[4/5]" />
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow opacity-0 transition group-hover:opacity-100"
        aria-label="Open full screen"
      >
        <Expand size={17} />
      </button>
    </div>
  );
}

function Lightbox({ images, index, onClose, onIndex }: { images: { url: string }[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Artwork viewer"
    >
      <button className="absolute right-5 top-5 text-white" onClick={onClose} aria-label="Close">
        <X size={28} />
      </button>
      <motion.img key={index} src={images[index]?.url} alt="" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-h-[88vh] max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {images.map((img, i) => (
            <button key={i} onClick={() => onIndex(i)} className={clsx('h-14 w-14 overflow-hidden rounded-lg ring-2', i === index ? 'ring-brand' : 'ring-transparent opacity-60')}>
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function Reviews({ artwork }: { artwork: ArtworkDetail }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const reviews = useQuery({ queryKey: ['reviews', artwork.id], queryFn: () => catalogApi.reviews(artwork.id) });
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const add = useMutation({
    mutationFn: () => catalogApi.addReview(artwork.id, { rating, title: title || undefined, body: body || undefined }),
    onSuccess: () => {
      setBody('');
      setTitle('');
      qc.invalidateQueries({ queryKey: ['reviews', artwork.id] });
    },
  });

  return (
    <section className="container-x py-16" aria-labelledby="reviews-title">
      <div className="grid gap-10 lg:grid-cols-3">
        <div>
          <h2 id="reviews-title" className="section-title">
            Reviews
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-4xl font-semibold">{artwork.ratingAverage.toFixed(1)}</span>
            <div>
              <Stars value={artwork.ratingAverage} />
              <p className="text-xs text-gray-500">{artwork.ratingCount} reviews</p>
            </div>
          </div>
          {user && (
            <form
              className="card mt-6 space-y-3 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                add.mutate();
              }}
            >
              <p className="text-sm font-semibold">Write a review</p>
              <p className="text-xs text-gray-500">Only collectors who purchased this artwork can review it.</p>
              <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} role="radio" aria-checked={rating === n} onClick={() => setRating(n)} className={clsx('text-2xl', n <= rating ? 'text-amber-400' : 'text-gray-300')}>
                    ★
                  </button>
                ))}
              </div>
              <input className="input" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
              <textarea className="input min-h-24" placeholder="What did you love about it?" value={body} onChange={(e) => setBody(e.target.value)} maxLength={3000} />
              {add.isError && <p className="text-xs text-red-600">{errorMessage(add.error)}</p>}
              {add.isSuccess && <p className="text-xs text-emerald-600">Thank you for your review!</p>}
              <button className="btn-brand w-full" disabled={add.isPending}>
                {add.isPending ? 'Posting…' : 'Post review'}
              </button>
            </form>
          )}
        </div>
        <div className="space-y-4 lg:col-span-2">
          {reviews.data?.data.length === 0 && <p className="text-sm text-gray-500">No reviews yet — be the first collector to share your thoughts.</p>}
          {reviews.data?.data.map((r) => (
            <Reveal key={r.id} className="card p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar src={r.user.avatarUrl ?? null} name={r.user.fullName} size={36} />
                  <div>
                    <p className="text-sm font-semibold">{r.user.fullName}</p>
                    <p className="text-xs text-gray-400">{date(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <BadgeCheck size={12} /> Verified purchase
                    </span>
                  )}
                  <Stars value={r.rating} />
                </div>
              </div>
              {r.title && <p className="mt-3 font-semibold">{r.title}</p>}
              {r.body && <p className="mt-1 text-sm leading-relaxed text-gray-600">{r.body}</p>}
              {!!r.images?.length && (
                <div className="mt-3 flex gap-2">
                  {r.images.map((img, i) => {
                    const url = typeof img === 'string' ? img : img.url;
                    return <img key={i} src={url} alt="Review" className="h-20 w-20 rounded-lg object-cover" />;
                  })}
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ArtworkDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['artwork', slug], queryFn: () => catalogApi.artwork(slug) });
  const a = q.data;
  const related = useQuery({ queryKey: ['artwork', a?.id, 'related'], queryFn: () => catalogApi.related(a!.id), enabled: !!a });
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [reported, setReported] = useState<'idle' | 'open' | 'done'>('idle');

  const addToCart = useMutation({
    mutationFn: () => cartApi.add({ artworkId: a!.id, quantity: 1 }),
    onSuccess: (cart) => qc.setQueryData(['cart'], cart),
  });

  const requireLogin = () => {
    if (!user) {
      navigate(`/login?next=/artworks/${slug}`);
      return false;
    }
    return true;
  };

  if (q.isLoading)
    return (
      <div className="container-x grid gap-10 pb-16 pt-28 lg:grid-cols-2">
        <Skeleton className="aspect-[4/5]" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  if (q.isError || !a)
    return (
      <div className="container-x pb-16 pt-28">
        <ErrorState message={errorMessage(q.error, 'This artwork could not be found.')} onRetry={() => q.refetch()} />
      </div>
    );

  const images = a.images.length ? a.images : a.imageUrl ? [{ id: 'main', url: a.imageUrl, thumbUrl: a.thumbnailUrl, width: null, height: null, isPrimary: true, altText: a.title }] : [];
  const current = images[index] ?? images[0];
  const dims = [a.widthCm, a.heightCm, a.depthCm].filter(Boolean).join(' × ');

  const details: [string, string | number | null | undefined][] = [
    ['Type', humanize(a.type)],
    ['Format', humanize(a.format)],
    ['Style', a.style?.name],
    ['Medium', a.medium?.name],
    ['Theme', a.theme?.name],
    ['Category', a.category?.name],
    ['Dimensions', dims ? `${dims} cm` : null],
    ['Orientation', humanize(a.orientation)],
    ['Year', a.yearCreated],
    ['SKU', a.sku],
  ];

  return (
    <>
      <div className="h-20 bg-ink" aria-hidden />
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <div className="container-x grid gap-10 py-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
              <ZoomImage src={current?.url ?? null} alt={current?.altText ?? a.title} onOpen={() => setLightbox(true)} />
            </motion.div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setIndex(i)}
                    aria-label={`View image ${i + 1}`}
                    className={clsx('h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition', i === index ? 'ring-brand' : 'ring-transparent opacity-70 hover:opacity-100')}
                  >
                    <img src={img.thumbUrl ?? img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-wrap gap-2">
              {a.category && (
                <Link to={`/gallery?category=${a.category.slug}`} className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand">
                  {a.category.name}
                </Link>
              )}
              {a.isFeatured && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Featured</span>}
            </div>
            <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-ink">{a.title}</h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
              <Link to={`/artists/${a.artist.slug}`} className="font-semibold text-ink hover:text-brand">
                {a.artist.displayName}
              </Link>
              {a.artist.gallery && (
                <>
                  <span>·</span>
                  <Link to={`/galleries/${a.artist.gallery.slug}`} className="hover:text-brand">
                    {a.artist.gallery.name}
                  </Link>
                </>
              )}
              {a.ratingCount > 0 && (
                <span className="flex items-center gap-1">
                  · <Stars value={a.ratingAverage} size={12} /> ({a.ratingCount})
                </span>
              )}
            </div>
            <PriceTag price={a.price} discountPrice={a.discountPrice} currency={a.currency} className="mt-6 text-3xl text-ink" />
            <p className={clsx('mt-2 text-sm font-medium', a.available ? 'text-emerald-600' : 'text-red-600')}>
              {a.available ? (a.format === 'DIGITAL' ? 'Instant digital download after payment' : `${a.availableQuantity} available`) : 'Sold out'}
            </p>

            <div className="mt-6 grid grid-cols-[1fr_1fr_auto] gap-3">
              <button
                className="btn-outline !py-3"
                disabled={!a.available || addToCart.isPending}
                onClick={() => requireLogin() && addToCart.mutate()}
              >
                <ShoppingBag size={17} /> {addToCart.isSuccess ? 'Added' : 'Add to cart'}
              </button>
              <button
                className="btn-brand !py-3"
                disabled={!a.available}
                onClick={async () => {
                  if (!requireLogin()) return;
                  try {
                    await addToCart.mutateAsync();
                  } catch {
                    // Already in cart is fine — proceed to checkout.
                  }
                  navigate('/checkout');
                }}
              >
                <Zap size={17} /> Buy now
              </button>
              <HeartButton type="ARTWORK" id={a.id} light className="!h-12 !w-12 border border-gray-200" />
            </div>
            {addToCart.isError && <p className="mt-2 text-xs text-red-600">{errorMessage(addToCart.error)}</p>}
            {addToCart.isSuccess && (
              <p className="mt-2 text-xs text-emerald-600">
                Added to your cart. <Link to="/cart" className="font-semibold underline">View cart</Link>
              </p>
            )}

            {(a.isCustomizable || a.artist.acceptsCustomArt) && (
              <Link
                to={`/create-your-art?artist=${a.artist.id}${a.style ? `&style=${a.style.id}` : ''}&artwork=${a.id}`}
                className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand to-magenta p-4 text-white shadow-lg transition hover:shadow-xl"
              >
                <span>
                  <span className="flex items-center gap-2 font-semibold">
                    <Sparkles size={16} /> Request customization
                  </span>
                  <span className="text-xs text-white/80">Have {a.artist.displayName} create a version from your own photo</span>
                </span>
                <span aria-hidden>→</span>
              </Link>
            )}

            {a.description && <p className="mt-8 whitespace-pre-line text-sm leading-relaxed text-gray-600">{a.description}</p>}

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-gray-100 pt-6 text-sm">
              {details
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs uppercase tracking-wider text-gray-400">{k}</dt>
                    <dd className="font-medium text-ink">{v}</dd>
                  </div>
                ))}
            </dl>
            {dims && (
              <p className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <Ruler size={14} /> Measurements are of the artwork itself, unframed.
              </p>
            )}
            {(a.collections.length > 0 || a.tags.length > 0) && (
              <div className="mt-6 flex flex-wrap gap-2">
                {a.collections.map((c) => (
                  <Link key={c.id} to={`/collections/${c.slug}`} className="chip">
                    ✦ {c.name}
                  </Link>
                ))}
                {a.tags.map((t) => (
                  <Link key={t.id} to={`/gallery?q=${encodeURIComponent(t.name)}`} className="chip">
                    #{t.name}
                  </Link>
                ))}
              </div>
            )}
            {(a.licenseInfo || a.copyrightInfo) && (
              <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-xs text-gray-500 [overflow-wrap:anywhere]">
                {a.licenseInfo && <p>License: {a.licenseInfo}</p>}
                {a.copyrightInfo && <p className="mt-1">© {linkify(a.copyrightInfo)}</p>}
              </div>
            )}

            <Link to={`/artists/${a.artist.slug}`} className="card mt-6 flex items-center gap-4 p-4 transition hover:shadow-md">
              <Avatar src={a.artist.avatarUrl} name={a.artist.displayName} size={52} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.artist.displayName}</p>
                <p className="line-clamp-2 text-xs text-gray-500">{a.artist.bio ?? `${a.artist.followerCount} followers`}</p>
              </div>
              <span className="text-sm font-semibold text-brand">Visit →</span>
            </Link>

            {reported === 'done' ? (
              <p className="mt-4 text-xs text-gray-400">Reported — thank you. Our moderators will review it.</p>
            ) : reported === 'open' ? (
              <form
                className="mt-4 space-y-2 rounded-2xl border border-gray-100 p-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  await catalogApi.report({
                    targetType: 'ARTWORK',
                    targetId: a.id,
                    reason: String(fd.get('reason')),
                    details: String(fd.get('details') ?? ''),
                  });
                  setReported('done');
                }}
              >
                <select name="reason" className="input !py-2" aria-label="Reason">
                  <option value="COPYRIGHT">Copyright complaint</option>
                  <option value="INAPPROPRIATE">Inappropriate content</option>
                  <option value="FRAUD">Fraud / misleading</option>
                  <option value="OTHER">Other</option>
                </select>
                <textarea name="details" className="input" placeholder="Tell us more" aria-label="Details" />
                <button className="btn-outline !py-1.5 text-xs">Submit report</button>
              </form>
            ) : (
              <button
                className="mt-4 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600"
                onClick={() => requireLogin() && setReported('open')}
              >
                <Flag size={12} /> Report this artwork
              </button>
            )}
          </motion.div>
        </div>
      </div>

      <Reviews artwork={a} />

      {!!related.data?.moreFromArtist.length && (
        <section className="container-x pb-12">
          <h2 className="section-title mb-6">More from {a.artist.displayName}</h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.data.moreFromArtist.slice(0, 4).map((x) => (
              <ArtworkTile key={x.id} artwork={x} variant="square" />
            ))}
          </div>
        </section>
      )}
      {!!related.data?.similar.length && (
        <section className="container-x pb-20">
          <h2 className="section-title mb-6">Similar artwork</h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.data.similar.slice(0, 8).map((x) => (
              <ArtworkTile key={x.id} artwork={x} variant="square" />
            ))}
          </div>
        </section>
      )}

      <AnimatePresence>{lightbox && images.length > 0 && <Lightbox images={images} index={index} onIndex={setIndex} onClose={() => setLightbox(false)} />}</AnimatePresence>
    </>
  );
}

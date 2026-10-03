import { plural } from '@/lib/format';
import { AnimatePresence, motion } from 'motion/react';
import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Brush, Camera, CheckCircle2, Palette, Quote, Sparkles, Upload } from 'lucide-react';
import { ArtistPortrait, ArtworkTile, CollectionTile } from '@/components/cards';
import { ArtImage, Counter, Reveal, SectionHeader, Stars } from '@/components/ui';
import type { ArtistCard, ArtworkCard, CollectionCard, TaxonomyItem, Testimonial } from '@/lib/types';

/** Optional admin-configured heading overrides (empty string = keep the default text). */
type Overrides = { title?: string; subtitle?: string };

export function CategoryMosaic({ categories, fallbackImages, title, subtitle }: { categories: TaxonomyItem[]; fallbackImages: string[] } & Overrides) {
  const tiles = categories.slice(0, 5);
  if (!tiles.length) return null;
  const spans = ['md:col-span-2 md:row-span-1', 'md:col-span-1', 'md:col-span-1', 'md:col-span-1', 'md:col-span-1'];
  return (
    <section className="container-x pt-20">
      <SectionHeader title={title || 'Category'} subtitle={subtitle || 'Wander the rooms of our gallery — each category curated from independent artists.'} />
      <div className="grid auto-rows-[220px] grid-cols-2 gap-4 md:grid-cols-3 md:auto-rows-[240px]">
        {tiles.map((c, i) => (
          <Reveal key={c.id} delay={i * 0.08} className={clsx(spans[i], i === 0 && 'col-span-2')}>
            <Link to={`/gallery?category=${c.slug}`} className="group relative block h-full overflow-hidden rounded-2xl">
              <ArtImage
                src={c.imageUrl ?? fallbackImages[i % Math.max(1, fallbackImages.length)]}
                alt={c.name}
                className="h-full"
                imgClassName="transition-transform duration-[1.4s] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent transition group-hover:from-brand/80" />
              <div className="absolute bottom-0 left-0 p-5 text-white">
                <h3 className="text-xl font-semibold drop-shadow">{c.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-white/80 opacity-0 transition group-hover:opacity-100">
                  {plural(c.artworkCount, 'artwork')} <ArrowUpRight size={13} />
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Link to="/categories" className="btn-brand">
          Explore All Categories
        </Link>
      </div>
    </section>
  );
}

export function ArtworkCarousel({ title, subtitle, artworks, to }: { title: string; subtitle?: string; artworks: ArtworkCard[]; to: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  if (!artworks.length) return null;
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * (scroller.current.clientWidth * 0.8), behavior: 'smooth' });
  return (
    <section className="container-x pt-24">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <Reveal>
          <h2 className="section-title">{title}</h2>
        </Reveal>
        {subtitle && <p className="max-w-md text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div ref={scroller} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4">
        {artworks.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i, 5) * 0.08, duration: 0.6 }}
            className="w-[70%] shrink-0 snap-start sm:w-[42%] md:w-[30%] lg:w-[23%]"
          >
            <ArtworkTile artwork={a} variant="square" />
          </motion.div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} aria-label="Previous" className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white transition hover:bg-brand">
            <ArrowLeft size={16} />
          </button>
          <button onClick={() => scroll(1)} aria-label="Next" className="grid h-10 w-10 place-items-center rounded-full border border-ink text-ink transition hover:border-brand hover:bg-brand hover:text-white">
            <ArrowRight size={16} />
          </button>
        </div>
        <Link to={to} className="btn-brand">
          Explore more
        </Link>
      </div>
    </section>
  );
}

export function PerfectArtBand({ artwork, stats, title, subtitle }: { artwork?: ArtworkCard; stats: { artworks: number; artists: number; customers: number; completedCustomArt: number } } & Overrides) {
  return (
    <section className="relative mt-28 overflow-hidden bg-ink py-20 text-white">
      {artwork?.imageUrl && <img src={artwork.imageUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-15 blur-2xl" />}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/60" aria-hidden />
      <div className="container-x relative grid items-center gap-12 md:grid-cols-12">
        <Reveal className="md:col-span-4">
          <motion.div whileHover={{ rotate: 0, scale: 1.03 }} initial={{ rotate: -4 }} className="mx-auto w-64 overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_color-mix(in_srgb,var(--color-brand)_60%,transparent)] ring-1 ring-white/10 md:w-full">
            <ArtImage src={artwork?.imageUrl} alt={artwork?.title ?? 'Featured artwork'} aspect="4 / 5" />
          </motion.div>
        </Reveal>
        <Reveal delay={0.15} className="md:col-span-4">
          <h2 className="text-3xl font-medium sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
            {title ? (
              title
            ) : (
              <>
                Find your <span className="text-gradient">Perfect Art</span>
              </>
            )}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            {subtitle ||
              'From museum-grade originals to limited prints and instant digital downloads — every piece comes straight from the artist who made it. Filter by mood, colour, size or style and find the piece that belongs on your wall.'}
          </p>
          <Link to="/gallery" className="btn-brand mt-6">
            Explore more <ArrowUpRight size={16} />
          </Link>
        </Reveal>
        <div className="grid gap-4 md:col-span-4">
          {[
            { value: stats.artworks, label: 'Artworks on display' },
            { value: stats.artists, label: 'Independent artists' },
            { value: stats.customers, label: 'Art lovers' },
          ].map((s, i) => (
            <Reveal key={s.label} delay={0.2 + i * 0.1}>
              <div className="glass rounded-2xl px-6 py-5">
                <p className="text-3xl font-semibold">
                  <Counter value={s.value} suffix="+" />
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/60">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StylesRow({ styles, title, subtitle }: { styles: TaxonomyItem[] } & Overrides) {
  if (!styles.length) return null;
  return (
    <section className="container-x pt-24">
      <SectionHeader title={title || 'Explore Art Styles'} subtitle={subtitle || 'From pencil sketches to pop art — find the visual language that speaks to you.'} action={{ label: 'All styles', to: '/gallery' }} />
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {styles.map((s, i) => (
          <Reveal key={s.id} delay={Math.min(i, 8) * 0.05} className="shrink-0">
            <Link to={`/gallery?style=${s.slug}`} className="group relative block h-44 w-36 overflow-hidden rounded-2xl sm:h-52 sm:w-40">
              <ArtImage src={s.imageUrl} alt={s.name} className="h-full" imgClassName="transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
              <div className="absolute bottom-0 p-3 text-white">
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-[11px] text-white/70">{plural(s.artworkCount, 'work')}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Upload, title: 'Upload a photo', text: 'Share a favourite memory. Your photos stay private — only your chosen artist can see them.' },
  { icon: Palette, title: 'Pick a style', text: 'Watercolor, oil, pencil sketch, anime, traditional Indian art and more.' },
  { icon: Brush, title: 'An artist creates it', text: 'Your artist sends a preview. Ask for revisions until it feels right.' },
  { icon: CheckCircle2, title: 'Approve & receive', text: 'Approve the final piece and get it delivered digitally or framed to your door.' },
];

export function PhotoToArt({ styles, title, subtitle }: { styles: TaxonomyItem[] } & Overrides) {
  const samples = styles.filter((s) => s.imageUrl).slice(0, 4);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (samples.length < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % samples.length), 3200);
    return () => clearInterval(t);
  }, [samples.length]);
  const current = samples[active];

  return (
    <section className="relative mt-28 overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-ink to-[#0d1c26] py-24 text-white">
      <div className="pointer-events-none absolute -left-20 top-10 h-80 w-80 animate-float rounded-full bg-magenta/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-96 w-96 animate-float rounded-full bg-teal/20 blur-3xl [animation-delay:2s]" aria-hidden />
      <div className="container-x relative grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-light">
            <Sparkles size={13} /> Signature experience
          </p>
          <h2 className="font-serif text-4xl font-medium leading-tight sm:text-5xl">
            {title ? (
              title
            ) : (
              <>
                Turn Your Photo <br />
                <span className="text-gradient italic">Into Art</span>
              </>
            )}
          </h2>
          <p className="mt-5 max-w-lg text-white/70">
            {subtitle ||
              'A wedding portrait in oils, your pet as a watercolor, the family in a traditional Indian painting with a temple behind them — commission a real artist to reimagine your photo, with previews and revisions along the way.'}
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                className="glass rounded-2xl p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-bold">{i + 1}</span>
                  <s.icon size={16} className="text-brand-light" />
                </div>
                <p className="font-semibold">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/60">{s.text}</p>
              </motion.li>
            ))}
          </ol>
          <Link to="/create-your-art" className="btn-brand mt-8 !px-7 !py-3 text-base">
            <Camera size={18} /> Create Your Art
          </Link>
        </Reveal>

        <Reveal delay={0.2} className="relative">
          <div className="relative mx-auto aspect-[4/5] max-w-md">
            <div className="absolute -left-6 top-10 z-10 w-40 -rotate-6 rounded-2xl bg-white p-2 shadow-2xl">
              <div className="grid aspect-square place-items-center rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500">
                <Camera size={36} />
              </div>
              <p className="mt-2 text-center text-[11px] font-semibold text-ink">Your photo</p>
            </div>
            <div className="h-full overflow-hidden rounded-3xl shadow-[0_40px_100px_-30px_color-mix(in_srgb,var(--color-brand)_80%,transparent)] ring-1 ring-white/10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current?.id ?? 'fallback'}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9 }}
                  className="h-full"
                >
                  <ArtImage src={current?.imageUrl} alt={current ? `${current.name} style sample` : 'Style sample'} className="h-full" />
                </motion.div>
              </AnimatePresence>
            </div>
            {current && (
              <motion.div key={current.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass absolute -bottom-5 right-6 rounded-full px-5 py-2 text-sm font-semibold">
                ✦ {current.name}
              </motion.div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function TrendingSection({ artworks, title, subtitle }: { artworks: ArtworkCard[] } & Overrides) {
  if (!artworks.length) return null;
  return (
    <section className="container-x pt-24">
      <SectionHeader title={title || 'Trending Artwork'} subtitle={subtitle || 'What collectors are looking at this week.'} action={{ label: 'Explore more', to: '/gallery?sort=trending' }} />
      <div className="masonry">
        {artworks.slice(0, 8).map((a, i) => (
          <Reveal key={a.id} delay={(i % 4) * 0.08}>
            <ArtworkTile artwork={a} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function CollectionsSection({ collections, title, subtitle }: { collections: CollectionCard[] } & Overrides) {
  if (!collections.length) return null;
  return (
    <section className="container-x pt-24">
      <SectionHeader title={title || 'More Collections'} subtitle={subtitle || 'Thoughtfully grouped series from our artists and curators.'} />
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {collections.slice(0, 8).map((c, i) => (
          <Reveal key={c.id} delay={(i % 4) * 0.08}>
            <CollectionTile collection={c} />
          </Reveal>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <Link to="/collections" className="btn-brand">
          Explore more
        </Link>
      </div>
    </section>
  );
}

export function ArtistsSection({ title, subtitle, artists }: { title: string; subtitle?: string; artists: ArtistCard[] }) {
  if (!artists.length) return null;
  return (
    <section className="container-x pt-24">
      <SectionHeader title={title} subtitle={subtitle || 'The people behind the paintings — follow them for new work.'} />
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {artists.slice(0, 8).map((a, i) => (
          <Reveal key={a.id} delay={(i % 4) * 0.08}>
            <ArtistPortrait artist={a} />
          </Reveal>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <Link to="/artists" className="btn-brand">
          Explore more
        </Link>
      </div>
    </section>
  );
}

export function Testimonials({ items, title, subtitle }: { items: Testimonial[] } & Overrides) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);
  if (!items.length) return null;
  const t = items[i];
  return (
    <section className="container-x py-24">
      {title && <SectionHeader title={title} subtitle={subtitle || undefined} />}
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-light px-6 py-16 text-center sm:px-16">
        <Quote className="mx-auto mb-6 text-brand" size={40} />
        <AnimatePresence mode="wait">
          <motion.figure key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
            <blockquote className="mx-auto max-w-3xl font-serif text-xl leading-relaxed text-ink sm:text-2xl">“{t.body}”</blockquote>
            <figcaption className="mt-6 flex flex-col items-center gap-2 text-sm">
              <Stars value={t.rating} />
              <span className="font-semibold text-ink">{t.userName}</span>
              {t.artworkTitle && t.artworkSlug && (
                <Link to={`/artworks/${t.artworkSlug}`} className="text-xs text-brand hover:underline">
                  on “{t.artworkTitle}”
                </Link>
              )}
            </figcaption>
          </motion.figure>
        </AnimatePresence>
        {items.length > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {items.map((x, idx) => (
              <button
                key={x.id}
                onClick={() => setI(idx)}
                aria-label={`Show story ${idx + 1}`}
                className={clsx('h-2 rounded-full transition-all', idx === i ? 'w-8 bg-brand' : 'w-2 bg-brand/30')}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function ArtworkRow({ title, subtitle, artworks }: { title: string; subtitle?: string; artworks: ArtworkCard[] }) {
  if (!artworks.length) return null;
  return (
    <section className="container-x pt-24">
      <SectionHeader title={title} subtitle={subtitle || undefined} />
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {artworks.slice(0, 4).map((a) => (
          <ArtworkTile key={a.id} artwork={a} variant="square" />
        ))}
      </div>
    </section>
  );
}

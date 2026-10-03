import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type Variants } from 'motion/react';
import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Search, Sparkles } from 'lucide-react';
import { SmartLink, useMotionPrefs, useSiteConfig } from '@/features/site/SiteConfigContext';
import type { HeroEffect } from '@/lib/siteConfig';
import type { Banner, TaxonomyItem } from '@/lib/types';

function PaintDots() {
  // Deterministic layout so renders are stable; colours follow the theme accents.
  const dots = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: (i * 37) % 100,
        top: (i * 53) % 100,
        size: 4 + ((i * 7) % 14),
        color: ['var(--color-magenta)', 'var(--color-brand)', 'var(--color-teal)', 'var(--color-sunset)', '#ffd23f'][i % 5],
        delay: (i % 7) * 0.6,
        duration: 6 + (i % 5),
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full blur-[1px]"
          style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size, background: d.color }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.85, 0.2] }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** Slide container variants per effect; `custom` is the navigation direction (1 = next, -1 = previous). */
const SLIDE_VARIANTS: Record<HeroEffect, Variants> = {
  fade: {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 1.1, ease: 'easeInOut' } },
    exit: { opacity: 0, transition: { duration: 1.1, ease: 'easeInOut' } },
  },
  slide: {
    enter: (dir: number) => ({ x: `${dir * 100}%`, opacity: 1 }),
    center: { x: '0%', opacity: 1, transition: { duration: 0.9, ease: EASE } },
    exit: (dir: number) => ({ x: `${dir * -35}%`, opacity: 0.2, transition: { duration: 0.9, ease: EASE } }),
  },
  zoom: {
    enter: { opacity: 0, scale: 1.25 },
    center: { opacity: 1, scale: 1, transition: { duration: 1.3, ease: EASE } },
    exit: { opacity: 0, scale: 0.92, transition: { duration: 0.9, ease: 'easeIn' } },
  },
  kenburns: {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 1.4, ease: 'easeInOut' } },
    exit: { opacity: 0, transition: { duration: 1.4, ease: 'easeInOut' } },
  },
};

/** Alternating slow zoom/pan paths for the Ken Burns effect. */
const KEN_BURNS = [
  { from: { scale: 1, x: '0%', y: '0%' }, to: { scale: 1.15, x: '-2%', y: '-2%' } },
  { from: { scale: 1.15, x: '2%', y: '0%' }, to: { scale: 1.02, x: '-1%', y: '1%' } },
  { from: { scale: 1.05, x: '-2%', y: '2%' }, to: { scale: 1.18, x: '1%', y: '-1%' } },
];

const HEIGHTS = { full: 'min-h-[92vh]', large: 'min-h-[76vh]', medium: 'min-h-[62vh]' } as const;

export function heroSlides(banners: Banner[] | undefined) {
  return (banners ?? []).filter((b) => b.imageUrl && (!b.placement || b.placement === 'HOME_HERO'));
}

export function Hero({ banners, overlapCard = true }: { banners?: Banner[]; overlapCard?: boolean }) {
  const { config } = useSiteConfig();
  const hero = config.hero;
  const motionPrefs = useMotionPrefs();
  const reduced = useReducedMotion() || !motionPrefs.enabled;
  const slides = useMemo(() => heroSlides(banners), [banners]);
  const count = slides.length;

  const ref = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [[index, dir], setPage] = useState<[number, number]>([0, 1]);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(typeof document !== 'undefined' && document.hidden);
  const pointerStart = useRef<number | null>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '25%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const current = count ? slides[((index % count) + count) % count] : undefined;
  const active = count ? ((index % count) + count) % count : 0;

  const go = useCallback((delta: number) => count > 1 && setPage(([i]) => [i + delta, delta]), [count]);
  const goTo = useCallback((target: number) => setPage(([i]) => [target, target >= ((i % count) + count) % count ? 1 : -1]), [count]);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Preload the next slide so transitions never flash an empty frame.
  useEffect(() => {
    if (count < 2) return;
    const next = slides[(active + 1) % count];
    if (next?.imageUrl) new Image().src = next.imageUrl;
  }, [active, count, slides]);

  const autoplay = hero.autoplay && count > 1 && !reduced;
  const paused = hovered || focused || hidden;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  };
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') pointerStart.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (pointerStart.current === null) return;
    const dx = e.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };

  const useBannerText = hero.useBannerText && !!current;
  const headline = useBannerText ? current!.title : hero.headline;
  const sub = useBannerText ? (current!.subtitle ?? '') : hero.subheadline;
  const primaryHref = useBannerText && current!.linkUrl ? current!.linkUrl : hero.primaryCtaHref;
  const effect: HeroEffect = reduced ? 'fade' : hero.effect;
  const kb = KEN_BURNS[active % KEN_BURNS.length];
  const overlay = hero.overlayOpacity;
  const d = motionPrefs.distance;

  return (
    <section
      ref={ref}
      className={clsx('relative flex items-center overflow-hidden bg-ink pt-28 text-white', HEIGHTS[hero.height], overlapCard ? 'pb-40' : 'pb-20')}
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-110">
        {current ? (
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={`${current.id}-${index}`}
              custom={dir}
              variants={SLIDE_VARIANTS[effect]}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
              data-testid="hero-slide"
              aria-roledescription="slide"
              aria-label={`${active + 1} of ${count}`}
            >
              <motion.img
                src={current.imageUrl}
                alt=""
                aria-hidden
                className="h-full w-full object-cover"
                initial={effect === 'kenburns' ? kb.from : false}
                animate={effect === 'kenburns' ? kb.to : undefined}
                transition={effect === 'kenburns' ? { duration: hero.intervalSeconds + 2, ease: 'linear' } : undefined}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="hero-fallback h-full w-full" />
        )}
      </motion.div>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, color-mix(in srgb, var(--color-ink) ${Math.min(95, overlay + 15)}%, transparent), color-mix(in srgb, var(--color-ink) ${overlay * 0.6}%, transparent) 45%, color-mix(in srgb, var(--color-ink) ${Math.min(95, overlay + 35)}%, transparent))`,
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,color-mix(in_srgb,var(--color-ink)_65%,transparent)_100%)]" aria-hidden />
      {hero.showParticles && !reduced && <PaintDots />}

      <motion.div style={{ opacity: fade }} className="container-x relative text-center">
        {hero.eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 20 * d }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-white/80 backdrop-blur"
          >
            <Sparkles size={13} /> {hero.eyebrow}
          </motion.p>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={useBannerText ? current!.id : 'static'}>
            <motion.h1
              initial={{ opacity: 0, y: 40 * d, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20 * d, filter: 'blur(8px)' }}
              transition={{ delay: 0.35, duration: 1.1 * motionPrefs.duration, ease: EASE }}
              className="font-script text-6xl leading-[1.05] drop-shadow-[0_6px_30px_rgba(0,0,0,.5)] sm:text-7xl lg:text-8xl"
            >
              {headline}
            </motion.h1>
            {sub && (
              <motion.p
                initial={{ opacity: 0, y: 20 * d }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="mx-auto mt-5 max-w-2xl text-base text-white/80 sm:text-lg"
              >
                {sub}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>

        {hero.showSearch && (
          <motion.form
            initial={{ opacity: 0, y: 20 * d }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            onSubmit={(e) => {
              e.preventDefault();
              navigate(q.trim() ? `/gallery?q=${encodeURIComponent(q.trim())}` : '/gallery');
            }}
            className="mx-auto mt-8 max-w-xl"
            role="search"
          >
            <p className="mb-3 text-sm font-medium text-white/90">Find the best art for your space</p>
            <div className="flex items-center rounded-full bg-white p-1.5 shadow-2xl shadow-black/30">
              <Search className="ml-3 text-gray-400" size={18} aria-hidden />
              <label htmlFor="hero-search" className="sr-only">
                Search artworks, artists, styles
              </label>
              <input
                id="hero-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search artworks, artists, styles…"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink outline-none"
              />
              <button className="btn-brand !px-5" aria-label="Search">
                <Search size={16} />
              </button>
            </div>
          </motion.form>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {hero.primaryCtaLabel && (
            <SmartLink href={primaryHref} className="btn-ghost">
              {hero.primaryCtaLabel} <ArrowRight size={16} />
            </SmartLink>
          )}
          {hero.secondaryCtaLabel && (
            <SmartLink href={hero.secondaryCtaHref} className="btn-brand animate-[pulse_3s_ease-in-out_infinite] hover:animate-none">
              <Sparkles size={16} /> {hero.secondaryCtaLabel}
            </SmartLink>
          )}
        </motion.div>
      </motion.div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="group absolute left-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:scale-110 hover:bg-white hover:text-ink sm:left-6"
          >
            <ChevronLeft size={22} className="transition group-hover:-translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="group absolute right-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:scale-110 hover:bg-white hover:text-ink sm:right-6"
          >
            <ChevronRight size={22} className="transition group-hover:translate-x-0.5" />
          </button>
          <div className={clsx('absolute inset-x-0 z-10 flex justify-center gap-2', overlapCard ? 'bottom-36' : 'bottom-8')} role="tablist" aria-label="Choose slide">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Go to slide ${i + 1}: ${s.title}`}
                onClick={() => goTo(i)}
                className={clsx('relative h-1.5 overflow-hidden rounded-full bg-white/30 transition-all duration-500 hover:bg-white/50', i === active ? 'w-14' : 'w-6')}
              >
                {i === active && (
                  <span
                    key={`${index}-${autoplay}`}
                    data-testid="hero-progress"
                    className="absolute inset-y-0 left-0 rounded-full bg-white"
                    style={
                      autoplay
                        ? { animation: `hero-progress ${hero.intervalSeconds}s linear forwards`, animationPlayState: paused ? 'paused' : 'running' }
                        : { width: '100%' }
                    }
                    onAnimationEnd={() => go(1)}
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

const PRICE_RANGES = [
  { label: 'Any price', value: '' },
  { label: 'Under ₹5,000', value: '0-5000' },
  { label: '₹5,000 – ₹20,000', value: '5000-20000' },
  { label: '₹20,000 – ₹50,000', value: '20000-50000' },
  { label: '₹50,000+', value: '50000-' },
];

export function FilterCard({
  categories,
  styles,
  mediums,
  overlap = true,
  title,
}: {
  categories: TaxonomyItem[];
  styles: TaxonomyItem[];
  mediums: TaxonomyItem[];
  /** Pull the card up over the hero (when it directly follows it). */
  overlap?: boolean;
  title?: string;
}) {
  const navigate = useNavigate();
  const [format, setFormat] = useState('');
  const [price, setPrice] = useState('');
  const [style, setStyle] = useState('');
  const [medium, setMedium] = useState('');
  const [category, setCategory] = useState('');

  const submit = () => {
    const p = new URLSearchParams();
    if (format) p.set('format', format);
    if (style) p.set('style', style);
    if (medium) p.set('medium', medium);
    if (category) p.set('category', category);
    if (price) {
      const [min, max] = price.split('-');
      if (min) p.set('minPrice', min);
      if (max) p.set('maxPrice', max);
    }
    navigate(`/gallery?${p.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: overlap ? 1.2 : 0.2, duration: 0.9, ease: EASE }}
      className={clsx('container-x relative z-10', overlap ? '-mt-28' : 'pt-20')}
    >
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-5 shadow-[0_30px_80px_-30px_rgba(11,10,18,.5)] sm:p-7">
        {title && <h2 className="mb-4 text-lg font-semibold text-ink">{title}</h2>}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <select aria-label="Art type" className="input" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="">Art type</option>
            <option value="ORIGINAL">Original</option>
            <option value="PRINT">Print</option>
            <option value="DIGITAL">Digital</option>
          </select>
          <select aria-label="Price range" className="input" value={price} onChange={(e) => setPrice(e.target.value)}>
            {PRICE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.value ? r.label : 'Price range'}
              </option>
            ))}
          </select>
          <select aria-label="Style" className="input" value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="">Style</option>
            {styles.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <select aria-label="Medium" className="input" value={medium} onChange={(e) => setMedium(e.target.value)}>
            <option value="">Medium</option>
            {mediums.map((m) => (
              <option key={m.id} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-gray-500">Filter:</span>
          {categories.slice(0, 7).map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCategory((cur) => (cur === c.slug ? '' : c.slug))}
              className={`chip ${category === c.slug ? 'chip-active' : ''}`}
              aria-pressed={category === c.slug}
            >
              {c.name}
            </button>
          ))}
          <button type="button" onClick={submit} className="btn-brand ml-auto !py-2">
            <Search size={15} /> Search
          </button>
        </div>
      </div>
    </motion.div>
  );
}

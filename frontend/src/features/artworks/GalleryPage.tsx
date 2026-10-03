import { plural } from '@/lib/format';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { clsx } from 'clsx';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Brush,
  Check,
  ChevronDown,
  Columns3,
  Crop,
  Droplets,
  Gem,
  Grid3x3,
  Image as ImageIcon,
  IndianRupee,
  LayoutGrid,
  Palette,
  Ruler,
  Search,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tags,
  Wand2,
  X,
} from 'lucide-react';
import { ArtworkTile } from '@/components/cards';
import { ErrorState } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import type { TaxonomyItem } from '@/lib/types';
import { useMotionPrefs } from '@/features/site/SiteConfigContext';
import { catalogApi } from './api';
import { useGalleryFilters, type FilterKey } from './useFilters';

export const COLORS = [
  { name: 'red', hex: '#e23b3b' },
  { name: 'orange', hex: '#ff8a3d' },
  { name: 'yellow', hex: '#ffd23f' },
  { name: 'green', hex: '#2fa35b' },
  { name: 'teal', hex: '#18c3c9' },
  { name: 'blue', hex: '#2f6fe0' },
  { name: 'purple', hex: '#8b2bd9' },
  { name: 'pink', hex: '#ff4fa3' },
  { name: 'brown', hex: '#8a5a3b' },
  { name: 'black', hex: '#111111' },
  { name: 'white', hex: '#f5f5f5' },
  { name: 'gold', hex: '#c9a227' },
];

const SORTS = [
  { value: 'newest', label: 'Newest', icon: Sparkles },
  { value: 'trending', label: 'Trending', icon: Star },
  { value: 'popular', label: 'Most loved', icon: Gem },
  { value: 'price_asc', label: 'Price ↑', icon: IndianRupee },
  { value: 'price_desc', label: 'Price ↓', icon: IndianRupee },
];

const FORMATS = [
  { value: 'ORIGINAL', label: 'Original', hint: 'One of a kind', icon: Brush, tone: 'from-brand to-magenta' },
  { value: 'PRINT', label: 'Print', hint: 'Fine-art prints', icon: ImageIcon, tone: 'from-sunset to-magenta' },
  { value: 'DIGITAL', label: 'Digital', hint: 'Instant download', icon: Sparkles, tone: 'from-teal to-brand' },
];

const PRICE_RANGES = [
  { label: 'Under ₹5k', min: '', max: '5000' },
  { label: '₹5k – 20k', min: '5000', max: '20000' },
  { label: '₹20k – 50k', min: '20000', max: '50000' },
  { label: '₹50k+', min: '50000', max: '' },
];

const ORIENTATIONS = [
  { value: 'PORTRAIT', label: 'Portrait', box: 'h-6 w-4' },
  { value: 'LANDSCAPE', label: 'Landscape', box: 'h-4 w-6' },
  { value: 'SQUARE', label: 'Square', box: 'h-5 w-5' },
  { value: 'PANORAMIC', label: 'Panoramic', box: 'h-3 w-7' },
];

const SIZES = [
  { value: 'small', label: 'Small (<40cm)' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large (>90cm)' },
];

const toItems = (list: TaxonomyItem[] | undefined) => (list ?? []).map((t) => ({ value: t.slug, label: t.name, count: t.artworkCount, image: t.imageUrl }));
const humanizeEnum = (v: string) => v.charAt(0) + v.slice(1).toLowerCase();

/* ───────────── Filter building blocks ───────────── */

function Section({
  title,
  icon: Icon,
  tone,
  active,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: typeof Palette;
  tone: string;
  active?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-gray-100 py-4 last:border-0">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 text-left" aria-expanded={open}>
        <span className={clsx('grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm', tone)}>
          <Icon size={15} />
        </span>
        <span className="flex-1 text-sm font-semibold text-ink">{title}</span>
        {active && <span className="h-2 w-2 rounded-full bg-magenta" aria-label="filter active" />}
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-gray-400">
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Chips({ items, value, onChange }: { items: { value: string; label: string; count?: number }[]; value?: string; onChange: (v: string | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => {
        const on = value === i.value;
        return (
          <motion.button
            type="button"
            key={i.value}
            whileTap={{ scale: 0.94 }}
            aria-pressed={on}
            onClick={() => onChange(on ? null : i.value)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              on ? 'border-transparent bg-gradient-to-r from-brand to-magenta text-white shadow-md shadow-brand/30' : 'border-gray-200 bg-white text-gray-600 hover:border-brand hover:text-brand',
            )}
          >
            {on && <Check size={12} aria-hidden />}
            {i.label}
            {i.count !== undefined && i.count > 0 && (
              <span className={clsx('text-[10px]', on ? 'text-white/80' : 'text-gray-400')} aria-hidden>
                {i.count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function Toggle({ label, icon: Icon, checked, onChange }: { label: string; icon: typeof Palette; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl px-1 py-2 text-sm">
      <Icon size={16} className={checked ? 'text-brand' : 'text-gray-400'} aria-hidden />
      <span className="flex-1">{label}</span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-gradient-to-r peer-checked:from-brand peer-checked:to-magenta peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40" aria-hidden>
        <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
    </label>
  );
}

export function FilterPanel() {
  const { filters, setFilter, setMany, clear, activeCount } = useGalleryFilters();
  const opts = { staleTime: 600_000 };
  const categories = useQuery({ queryKey: ['taxonomy', 'categories'], queryFn: () => catalogApi.taxonomy('categories'), ...opts });
  const styles = useQuery({ queryKey: ['taxonomy', 'styles'], queryFn: () => catalogApi.taxonomy('styles'), ...opts });
  const mediums = useQuery({ queryKey: ['taxonomy', 'mediums'], queryFn: () => catalogApi.taxonomy('mediums'), ...opts });
  const themes = useQuery({ queryKey: ['taxonomy', 'themes'], queryFn: () => catalogApi.taxonomy('themes'), ...opts });
  const [min, setMin] = useState(filters.minPrice ?? '');
  const [max, setMax] = useState(filters.maxPrice ?? '');

  useEffect(() => {
    setMin(filters.minPrice ?? '');
    setMax(filters.maxPrice ?? '');
  }, [filters.minPrice, filters.maxPrice]);

  const set = (k: FilterKey) => (v: string | null) => setFilter(k, v);

  return (
    <div>
      <div className="flex items-center justify-between pb-2">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <SlidersHorizontal size={17} className="text-brand" /> Filters
          {activeCount > 0 && <span className="rounded-full bg-magenta px-2 py-0.5 text-[11px] font-bold text-white">{activeCount}</span>}
        </h2>
        {activeCount > 0 && (
          <button onClick={clear} className="text-xs font-semibold text-brand hover:underline">
            Clear all
          </button>
        )}
      </div>

      <Section title="Category" icon={Tags} tone="from-brand to-magenta" active={!!filters.category}>
        <Chips items={toItems(categories.data)} value={filters.category} onChange={set('category')} />
      </Section>

      <Section title="Type" icon={Shapes} tone="from-sunset to-magenta" active={!!filters.format}>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map((f) => {
            const on = filters.format === f.value;
            return (
              <motion.button
                type="button"
                key={f.value}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                aria-pressed={on}
                aria-label={f.label}
                onClick={() => setFilter('format', on ? null : f.value)}
                className={clsx(
                  'flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition',
                  on ? 'border-transparent bg-gradient-to-br text-white shadow-lg ' + f.tone : 'border-gray-200 bg-white text-gray-600 hover:border-brand',
                )}
              >
                <f.icon size={18} aria-hidden />
                <span className="text-xs font-semibold">{f.label}</span>
                <span className={clsx('text-[10px] leading-tight', on ? 'text-white/80' : 'text-gray-400')}>{f.hint}</span>
              </motion.button>
            );
          })}
        </div>
      </Section>

      <Section title="Colour" icon={Droplets} tone="from-teal to-brand" active={!!filters.color}>
        <div className="grid grid-cols-6 gap-2">
          {COLORS.map((c) => {
            const on = filters.color === c.name;
            const light = ['white', 'yellow'].includes(c.name);
            return (
              <motion.button
                type="button"
                key={c.name}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                title={c.name}
                aria-label={`Colour ${c.name}`}
                aria-pressed={on}
                onClick={() => setFilter('color', on ? null : c.name)}
                className={clsx('grid aspect-square place-items-center rounded-full border border-black/10 shadow-sm transition', on && 'ring-2 ring-brand ring-offset-2')}
                style={{ background: c.hex }}
              >
                {on && <Check size={14} className={light ? 'text-ink' : 'text-white'} aria-hidden />}
              </motion.button>
            );
          })}
        </div>
      </Section>

      <Section title="Price" icon={IndianRupee} tone="from-emerald-500 to-teal" active={!!(filters.minPrice || filters.maxPrice)}>
        <div className="mb-3 flex flex-wrap gap-2">
          {PRICE_RANGES.map((r) => {
            const on = (filters.minPrice ?? '') === r.min && (filters.maxPrice ?? '') === r.max;
            return (
              <button
                type="button"
                key={r.label}
                aria-pressed={on}
                onClick={() => setMany(on ? { minPrice: null, maxPrice: null } : { minPrice: r.min || null, maxPrice: r.max || null })}
                className={clsx(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                  on ? 'border-transparent bg-gradient-to-r from-emerald-500 to-teal text-white shadow' : 'border-gray-200 text-gray-600 hover:border-teal hover:text-teal',
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setMany({ minPrice: min || null, maxPrice: max || null });
          }}
        >
          <input aria-label="Minimum price" className="input !py-2" inputMode="numeric" placeholder="₹ Min" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} />
          <span className="text-gray-400">–</span>
          <input aria-label="Maximum price" className="input !py-2" inputMode="numeric" placeholder="₹ Max" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} />
          <button className="btn-brand !px-4 !py-2">Go</button>
        </form>
      </Section>

      <Section title="Style" icon={Palette} tone="from-magenta to-sunset" active={!!filters.style}>
        <Chips items={toItems(styles.data)} value={filters.style} onChange={set('style')} />
      </Section>

      <Section title="Medium" icon={Brush} tone="from-sunset to-amber-400" active={!!filters.medium} defaultOpen={false}>
        <Chips items={toItems(mediums.data)} value={filters.medium} onChange={set('medium')} />
      </Section>

      <Section title="Theme" icon={Sparkles} tone="from-brand to-teal" active={!!filters.theme} defaultOpen={false}>
        <Chips items={toItems(themes.data)} value={filters.theme} onChange={set('theme')} />
      </Section>

      <Section title="Shape & size" icon={Crop} tone="from-ink-3 to-brand" active={!!(filters.orientation || filters.size)} defaultOpen={false}>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {ORIENTATIONS.map((o) => {
            const on = filters.orientation === o.value;
            return (
              <button
                type="button"
                key={o.value}
                aria-pressed={on}
                aria-label={o.label}
                onClick={() => setFilter('orientation', on ? null : o.value)}
                className={clsx('flex flex-col items-center gap-1.5 rounded-xl border py-2 text-[10px] font-medium transition', on ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-gray-500 hover:border-brand')}
              >
                <span className={clsx('rounded-[3px] border-2', o.box, on ? 'border-brand bg-brand/20' : 'border-gray-400')} aria-hidden />
                {o.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Ruler size={14} aria-hidden /> Size
        </div>
        <div className="mt-2">
          <Chips items={SIZES} value={filters.size} onChange={set('size')} />
        </div>
      </Section>

      <div className="pt-3">
        <Toggle label="Customizable artworks only" icon={Wand2} checked={filters.customizable === 'true'} onChange={(v) => setFilter('customizable', v ? 'true' : null)} />
        <Toggle label="Featured only" icon={Star} checked={filters.featured === 'true'} onChange={(v) => setFilter('featured', v ? 'true' : null)} />
      </div>
    </div>
  );
}

/* ───────────── Header with animated colour mesh and category pictures ───────────── */

function GalleryHero({ total, q, setQ, onSearch }: { total: number; q: string; setQ: (v: string) => void; onSearch: () => void }) {
  const { filters, setFilter } = useGalleryFilters();
  const categories = useQuery({ queryKey: ['taxonomy', 'categories'], queryFn: () => catalogApi.taxonomy('categories'), staleTime: 600_000 });
  const motionPrefs = useMotionPrefs();
  const blobs = [
    { c: 'bg-brand', x: '-10%', y: '-30%', s: 'h-96 w-96' },
    { c: 'bg-magenta', x: '60%', y: '-20%', s: 'h-80 w-80' },
    { c: 'bg-teal', x: '80%', y: '40%', s: 'h-72 w-72' },
    { c: 'bg-sunset', x: '25%', y: '55%', s: 'h-64 w-64' },
  ];
  return (
    <section className="relative overflow-hidden bg-ink pb-10 pt-28 text-white">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          aria-hidden
          className={clsx('pointer-events-none absolute rounded-full opacity-40 blur-3xl', b.c, b.s)}
          style={{ left: b.x, top: b.y }}
          animate={motionPrefs.enabled ? { x: [0, 40, -30, 0], y: [0, -30, 25, 0], scale: [1, 1.15, 0.95, 1] } : undefined}
          transition={{ duration: 16 + i * 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_20%,rgba(0,0,0,.45)_100%)]" aria-hidden />

      <div className="container-x relative">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] backdrop-blur">
          <Palette size={13} /> {total > 0 ? `${total} artworks on display` : 'Explore the collection'}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8 }}
          className="font-serif text-5xl leading-tight sm:text-6xl"
        >
          The{' '}
          <span className="bg-gradient-to-r from-magenta via-sunset to-teal bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">Gallery</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-3 max-w-2xl text-white/75">
          Original paintings, prints and digital art from independent artists. Wander, filter, fall in love.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          role="search"
          className="mt-7 flex max-w-2xl items-center rounded-full bg-white p-1.5 pl-5 shadow-2xl shadow-black/30"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch();
          }}
        >
          <Search size={18} className="text-gray-400" aria-hidden />
          <input
            aria-label="Search artworks"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by artwork, artist, gallery, style, medium or tag"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink outline-none"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} className="mr-1 rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="Clear search text">
              <X size={15} />
            </button>
          )}
          <button className="btn-brand !py-2.5">Search</button>
        </motion.form>

        {/* Category quick-picks: round pictures */}
        <div className="-mx-4 mt-8 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          <CategoryBubble label="All art" active={!filters.category} onClick={() => setFilter('category', null)} />
          {(categories.data ?? []).map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + Math.min(i, 10) * 0.04 }}>
              <CategoryBubble
                label={c.name}
                image={c.imageUrl}
                active={filters.category === c.slug}
                onClick={() => setFilter('category', filters.category === c.slug ? null : c.slug)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryBubble({ label, image, active, onClick }: { label: string; image?: string | null; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} aria-label={`Category ${label}`} className="group flex w-20 shrink-0 flex-col items-center gap-2">
      <span
        className={clsx(
          'relative grid h-16 w-16 place-items-center overflow-hidden rounded-full p-[3px] transition duration-300 group-hover:scale-105',
          active ? 'bg-gradient-to-tr from-magenta via-sunset to-teal shadow-lg shadow-magenta/40' : 'bg-white/15',
        )}
      >
        <span className="block h-full w-full overflow-hidden rounded-full bg-gradient-to-br from-brand to-magenta">
          {image ? (
            <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
          ) : (
            <LayoutGrid className="m-auto mt-4 text-white" size={22} aria-hidden />
          )}
        </span>
      </span>
      <span className={clsx('line-clamp-1 text-center text-[11px] font-medium', active ? 'text-white' : 'text-white/70')}>{label}</span>
    </button>
  );
}

/* ───────────── Toolbar: active filters, sort, view ───────────── */

function ActivePills() {
  const { filters, setFilter, setMany, clear } = useGalleryFilters();
  const categories = useQuery({ queryKey: ['taxonomy', 'categories'], queryFn: () => catalogApi.taxonomy('categories'), staleTime: 600_000 });
  const styles = useQuery({ queryKey: ['taxonomy', 'styles'], queryFn: () => catalogApi.taxonomy('styles'), staleTime: 600_000 });
  const mediums = useQuery({ queryKey: ['taxonomy', 'mediums'], queryFn: () => catalogApi.taxonomy('mediums'), staleTime: 600_000 });
  const themes = useQuery({ queryKey: ['taxonomy', 'themes'], queryFn: () => catalogApi.taxonomy('themes'), staleTime: 600_000 });
  const name = (list: TaxonomyItem[] | undefined, slug?: string) => list?.find((t) => t.slug === slug)?.name ?? slug;

  const pills: { key: string; label: string; remove: () => void; color?: string }[] = [];
  if (filters.q) pills.push({ key: 'q', label: `“${filters.q}”`, remove: () => setFilter('q', null) });
  if (filters.category) pills.push({ key: 'category', label: name(categories.data, filters.category)!, remove: () => setFilter('category', null) });
  if (filters.format) pills.push({ key: 'format', label: humanizeEnum(filters.format), remove: () => setFilter('format', null) });
  if (filters.style) pills.push({ key: 'style', label: name(styles.data, filters.style)!, remove: () => setFilter('style', null) });
  if (filters.medium) pills.push({ key: 'medium', label: name(mediums.data, filters.medium)!, remove: () => setFilter('medium', null) });
  if (filters.theme) pills.push({ key: 'theme', label: name(themes.data, filters.theme)!, remove: () => setFilter('theme', null) });
  if (filters.color) pills.push({ key: 'color', label: filters.color, color: COLORS.find((c) => c.name === filters.color)?.hex, remove: () => setFilter('color', null) });
  if (filters.minPrice || filters.maxPrice)
    pills.push({
      key: 'price',
      label: `₹${filters.minPrice || '0'} – ${filters.maxPrice ? `₹${filters.maxPrice}` : 'any'}`,
      remove: () => setMany({ minPrice: null, maxPrice: null }),
    });
  if (filters.orientation) pills.push({ key: 'orientation', label: humanizeEnum(filters.orientation), remove: () => setFilter('orientation', null) });
  if (filters.size) pills.push({ key: 'size', label: `${humanizeEnum(filters.size)} size`, remove: () => setFilter('size', null) });
  if (filters.customizable) pills.push({ key: 'customizable', label: 'Customizable', remove: () => setFilter('customizable', null) });
  if (filters.featured) pills.push({ key: 'featured', label: 'Featured', remove: () => setFilter('featured', null) });
  if (!pills.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence initial={false}>
        {pills.map((p) => (
          <motion.button
            layout
            key={p.key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={p.remove}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-xs font-semibold capitalize text-brand transition hover:bg-brand hover:text-white"
            aria-label={`Remove filter ${p.label}`}
          >
            {p.color && <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: p.color }} aria-hidden />}
            {p.label}
            <X size={12} aria-hidden />
          </motion.button>
        ))}
      </AnimatePresence>
      {pills.length > 1 && (
        <button onClick={clear} className="text-xs font-semibold text-gray-500 underline-offset-4 hover:text-brand hover:underline">
          Clear all
        </button>
      )}
    </div>
  );
}

/* ───────────── Page ───────────── */

type View = 'masonry' | 'grid';

export default function GalleryPage() {
  const { filters, setFilter, activeCount, clear } = useGalleryFilters();
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState(filters.q ?? '');
  const [view, setView] = useState<View>(() => {
    try {
      return (localStorage.getItem('gallery-view') as View) || 'masonry';
    } catch {
      return 'masonry';
    }
  });
  useEffect(() => setQ(filters.q ?? ''), [filters.q]);
  useEffect(() => {
    try {
      localStorage.setItem('gallery-view', view);
    } catch {
      /* per-visitor convenience only */
    }
  }, [view]);

  const query = useInfiniteQuery({
    queryKey: ['artworks', filters],
    queryFn: ({ pageParam }) => catalogApi.artworks({ ...filters, page: pageParam, pageSize: 24 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    placeholderData: (prev) => prev, // keep showing results while a new filter loads (no flash)
  });
  const artworks = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;
  const refreshing = query.isFetching && !query.isFetchingNextPage && !query.isLoading;

  return (
    <>
      <GalleryHero total={total} q={q} setQ={setQ} onSearch={() => setFilter('q', q.trim() || null)} />

      <div className="bg-gradient-to-b from-brand-light/50 via-white to-white">
        <div className="container-x py-8">
          <div className="grid gap-8 lg:grid-cols-[290px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-white bg-white/80 p-5 shadow-[0_20px_60px_-30px_rgba(11,10,18,.35)] backdrop-blur">
                <FilterPanel />
              </div>
            </aside>

            <div className="min-w-0">
              {/* Toolbar */}
              <div className="sticky top-[72px] z-20 -mx-2 mb-6 rounded-2xl bg-white/85 px-3 py-3 shadow-sm backdrop-blur">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink" aria-live="polite">
                    {query.isLoading ? 'Loading artworks…' : plural(total, 'artwork')}
                    {refreshing && <span className="h-2 w-2 animate-ping rounded-full bg-brand" aria-hidden />}
                  </p>
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => setDrawer(true)} className="btn-outline !px-4 !py-2 lg:hidden">
                      <SlidersHorizontal size={15} /> Filters
                      {activeCount > 0 && <span className="rounded-full bg-magenta px-1.5 text-[10px] font-bold text-white">{activeCount}</span>}
                    </button>
                    <label className="sr-only" htmlFor="sort">
                      Sort
                    </label>
                    <select id="sort" className="input !w-auto !rounded-full !py-2 md:hidden" value={filters.sort ?? 'newest'} onChange={(e) => setFilter('sort', e.target.value)}>
                      {SORTS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <LayoutGroup id="sort">
                      <div className="hidden items-center rounded-full bg-gray-100 p-1 md:flex" role="radiogroup" aria-label="Sort by">
                        {SORTS.map((s) => {
                          const on = (filters.sort ?? 'newest') === s.value;
                          return (
                            <button
                              key={s.value}
                              role="radio"
                              aria-checked={on}
                              onClick={() => setFilter('sort', s.value)}
                              className={clsx('relative rounded-full px-3 py-1.5 text-xs font-semibold transition', on ? 'text-white' : 'text-gray-500 hover:text-ink')}
                            >
                              {on && <motion.span layoutId="sort-pill" className="absolute inset-0 rounded-full bg-gradient-to-r from-brand to-magenta shadow" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                              <span className="relative flex items-center gap-1">
                                <s.icon size={12} aria-hidden /> {s.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </LayoutGroup>
                    <div className="flex items-center rounded-full bg-gray-100 p-1" role="radiogroup" aria-label="Layout">
                      {(
                        [
                          ['masonry', Columns3, 'Masonry view'],
                          ['grid', Grid3x3, 'Grid view'],
                        ] as const
                      ).map(([v, Icon, label]) => (
                        <button
                          key={v}
                          role="radio"
                          aria-checked={view === v}
                          aria-label={label}
                          title={label}
                          onClick={() => setView(v)}
                          className={clsx('rounded-full p-1.5 transition', view === v ? 'bg-white text-brand shadow' : 'text-gray-400 hover:text-ink')}
                        >
                          <Icon size={15} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-2 empty:hidden">
                  <ActivePills />
                </div>
              </div>

              {query.isLoading && <ShimmerGrid />}
              {query.isError && <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} />}
              {!query.isLoading && !query.isError && artworks.length === 0 && <NoResults onClear={clear} hasFilters={activeCount > 0 || !!filters.q} />}

              <motion.div animate={{ opacity: refreshing ? 0.55 : 1 }} transition={{ duration: 0.2 }}>
                <Results artworks={artworks} view={view} />
              </motion.div>

              {query.hasNextPage && (
                <div className="mt-10 flex justify-center">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-brand !px-8" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
                    {query.isFetchingNextPage ? 'Loading…' : `Load more artwork (${total - artworks.length} more)`}
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.aside
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-3xl bg-white"
              aria-label="Filters"
            >
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-200" aria-hidden />
              <button className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100" onClick={() => setDrawer(false)} aria-label="Close filters">
                <X />
              </button>
              <div className="flex-1 overflow-y-auto px-6 pb-4 pt-4">
                <FilterPanel />
              </div>
              <div className="border-t border-gray-100 p-4">
                <button className="btn-brand w-full" onClick={() => setDrawer(false)}>
                  Show {plural(total, 'artwork')}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Results({ artworks, view }: { artworks: Parameters<typeof ArtworkTile>[0]['artwork'][]; view: View }) {
  const m = useMotionPrefs();
  const item = (i: number) => ({
    initial: { opacity: 0, y: 28 * m.distance, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.5 * m.duration, delay: Math.min(i % 24, 12) * 0.04 * m.stagger },
  });
  if (view === 'grid') {
    return (
      <motion.div layout className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {artworks.map((a, i) => (
            <motion.div key={a.id} layout exit={{ opacity: 0, scale: 0.9 }} {...item(i)}>
              <ArtworkTile artwork={a} variant="square" priority={i < 4} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }
  return (
    <div className="masonry">
      {artworks.map((a, i) => (
        <motion.div key={a.id} {...item(i)}>
          <ArtworkTile artwork={a} priority={i < 4} />
        </motion.div>
      ))}
    </div>
  );
}

function ShimmerGrid() {
  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-light to-gray-100" style={{ height: [300, 240, 340, 270][i % 4] }}>
          <motion.div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }}
          />
        </div>
      ))}
    </div>
  );
}

function NoResults({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center rounded-3xl border border-dashed border-brand/30 bg-white px-6 py-16 text-center">
      <motion.div
        animate={{ rotate: [0, 8, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-magenta via-brand to-teal text-white shadow-lg"
      >
        <Palette size={34} />
      </motion.div>
      <h3 className="text-xl font-semibold text-ink">No artworks match yet</h3>
      <p className="mt-2 max-w-md text-sm text-gray-500">Try removing a filter or searching for something broader — or ask an artist to create exactly what you imagine.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {hasFilters && (
          <button className="btn-outline" onClick={onClear}>
            Clear filters
          </button>
        )}
        <Link to="/create-your-art" className="btn-brand">
          <Wand2 size={16} /> Create your own art
        </Link>
      </div>
    </motion.div>
  );
}

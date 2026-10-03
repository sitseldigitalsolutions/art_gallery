import { motion, useInView, useMotionValue, useSpring, useTransform, type HTMLMotionProps } from 'motion/react';
import { clsx } from 'clsx';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ImageOff, Star } from 'lucide-react';

/** Fade/slide-in when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  ...rest
}: { children: ReactNode; delay?: number; y?: number; className?: string } & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  dark,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: { label: string; to: string };
  dark?: boolean;
}) {
  return (
    <Reveal className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h2 className={clsx('section-title', dark && 'text-white')}>{title}</h2>
        {subtitle && <p className={clsx('mt-2 text-sm leading-relaxed', dark ? 'text-white/60' : 'text-gray-500')}>{subtitle}</p>}
      </div>
      {action && (
        <Link to={action.to} className="btn-brand shrink-0 self-start sm:self-auto">
          {action.label} <ArrowRight size={16} />
        </Link>
      )}
    </Reveal>
  );
}

export function ArtImage({
  src,
  alt,
  className,
  imgClassName,
  aspect,
  eager,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  aspect?: string;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className={clsx('relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200', className)} style={aspect ? { aspectRatio: aspect } : undefined}>
      {!loaded && !failed && src && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100" />}
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={clsx('h-full w-full object-cover transition-opacity duration-700', loaded ? 'opacity-100' : 'opacity-0', imgClassName)}
        />
      ) : (
        <div className="hero-fallback flex h-full min-h-32 w-full items-center justify-center text-white/70">
          <ImageOff size={28} aria-hidden />
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-2xl bg-gray-100', className)} />;
}

export function GridSkeleton({ count = 8, className = 'h-72' }: { count?: number; className?: string }) {
  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 px-6 py-16 text-center">
      <div className="mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-magenta via-brand to-teal opacity-80" />
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-gray-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-3xl bg-red-50 px-6 py-12 text-center text-red-700">
      <AlertTriangle />
      <p className="text-sm">{message ?? 'We could not load this right now.'}</p>
      {onRetry && (
        <button className="btn-outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
      ))}
    </span>
  );
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      <button className="chip" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Prev
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="text-gray-400">…</span>}
          <button className={clsx('chip', p === page && 'chip-active')} aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)}>
            {p}
          </button>
        </span>
      ))}
      <button className="chip" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}

/** Animated number counter used in stat cards. */
export function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1800, bounce: 0 });
  const display = useTransform(spring, (v) => `${Math.round(v).toLocaleString('en-IN')}${suffix}`);
  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);
  return <motion.span ref={ref}>{display}</motion.span>;
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    /APPROVED|COMPLETED|PAID|DELIVERED|FULFILLED|AVAILABLE|CONFIRMED/.test(status)
      ? 'bg-emerald-50 text-emerald-700'
      : /REJECT|CANCEL|FAIL|SUSPEND/.test(status)
        ? 'bg-red-50 text-red-700'
        : /PREVIEW|REVISION|PENDING|REVIEW|REQUESTED|AWAITING/.test(status)
          ? 'bg-amber-50 text-amber-700'
          : 'bg-brand-light text-brand';
  return <span className={clsx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', tone)}>{status.replace(/_/g, ' ')}</span>;
}

export function PageHero({ title, subtitle, image }: { title: string; subtitle?: string; image?: string | null }) {
  return (
    <section className="relative overflow-hidden bg-ink pb-16 pt-32 text-white">
      {image ? (
        <img src={image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-40" />
      ) : (
        <div className="hero-fallback absolute inset-0 opacity-60" aria-hidden />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink" aria-hidden />
      <div className="container-x relative">
        <Reveal>
          <h1 className="font-serif text-4xl font-medium sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl text-white/70">{subtitle}</p>}
        </Reveal>
      </div>
    </section>
  );
}

import { useMutation, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ImagePlus, Lock, Palette, Sparkles, Trash2, User, Wand2 } from 'lucide-react';
import { Avatar } from '@/components/cards';
import { ArtImage, EmptyState, Skeleton } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { artistsApi } from '@/features/artists/api';
import { catalogApi } from '@/features/artworks/api';
import { errorMessage } from '@/lib/api';
import { money } from '@/lib/format';
import type { ArtistCard, CustomArtDetail, TaxonomyItem } from '@/lib/types';
import { customArtApi } from './api';
import { addPhotos, CUSTOM_OPTIONS, PHOTO_MAX_COUNT } from './validation';

const STEPS = [
  { title: 'Upload photo', icon: ImagePlus },
  { title: 'Select style', icon: Palette },
  { title: 'Select artist', icon: User },
  { title: 'Customize', icon: Wand2 },
  { title: 'Review', icon: CheckCircle2 },
];

type Format = 'DIGITAL' | 'PRINT' | 'ORIGINAL';

export interface WizardState {
  photos: File[];
  styleId: string;
  artistId: string;
  selectedArtworkId: string;
  title: string;
  instructions: string;
  options: Record<string, string>;
  requestedDimensions: string;
  requestedFormat: Format;
  budget: string;
}

export function PhotoStep({ photos, onChange }: { photos: File[]; onChange: (files: File[]) => void }) {
  const [errors, setErrors] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => photos.map((f) => ({ file: f, url: typeof URL.createObjectURL === 'function' ? URL.createObjectURL(f) : '' })), [photos]);
  useEffect(() => () => previews.forEach((p) => p.url && URL.revokeObjectURL(p.url)), [previews]);

  const accept = (list: FileList | File[] | null) => {
    if (!list) return;
    const res = addPhotos(photos, Array.from(list));
    setErrors(res.errors);
    onChange(res.files);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    accept(e.dataTransfer.files);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Upload your photo</h2>
      <p className="mt-1 text-sm text-gray-500">A clear, well-lit photo works best. Add up to {PHOTO_MAX_COUNT} (e.g. different angles or people to combine).</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload photos"
        className={clsx(
          'mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-14 text-center transition',
          drag ? 'border-brand bg-brand-light' : 'border-gray-200 hover:border-brand hover:bg-brand-light/40',
        )}
      >
        <motion.div animate={{ y: drag ? -6 : 0 }} className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand to-magenta text-white shadow-lg">
          <ImagePlus />
        </motion.div>
        <p className="font-semibold">Drag & drop or click to choose</p>
        <p className="mt-1 text-xs text-gray-500">JPEG, PNG or WebP · up to 15 MB each</p>
        <input
          ref={input}
          data-testid="photo-input"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            accept(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <Lock size={13} className="text-brand" /> Your photos are private. They’re stored securely, stripped of location data, and visible only to you, your
        chosen artist and our moderators.
      </p>
      {errors.length > 0 && (
        <ul role="alert" className="mt-3 space-y-1 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {photos.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
          <AnimatePresence>
            {previews.map((p, i) => (
              <motion.div key={p.file.name + i} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
                {p.url && <img src={p.url} alt={`Selected photo ${i + 1}`} className="h-full w-full object-cover" />}
                <button
                  type="button"
                  onClick={() => onChange(photos.filter((_, j) => j !== i))}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function StyleStep({ styles, loading, value, onChange }: { styles: TaxonomyItem[]; loading: boolean; value: string; onChange: (id: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">Choose an art style</h2>
      <p className="mt-1 text-sm text-gray-500">How should your photo be reimagined?</p>
      {loading && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      )}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {styles.map((s) => (
          <motion.button
            type="button"
            key={s.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            aria-pressed={value === s.id}
            onClick={() => onChange(s.id)}
            className={clsx('group relative overflow-hidden rounded-2xl text-left ring-2 transition', value === s.id ? 'ring-brand' : 'ring-transparent')}
          >
            <ArtImage src={s.imageUrl} alt={s.name} aspect="4 / 5" imgClassName="transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
            <span className="absolute bottom-3 left-3 right-3 font-semibold text-white">{s.name}</span>
            {value === s.id && (
              <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-brand text-white">
                <Check size={15} />
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function ArtistStep({ artists, loading, value, onChange }: { artists: ArtistCard[]; loading: boolean; value: string; onChange: (id: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">Pick your artist</h2>
      <p className="mt-1 text-sm text-gray-500">These artists accept custom commissions in your chosen style. They’ll send you a quote after reviewing your request.</p>
      {loading && <Skeleton className="mt-6 h-40" />}
      {!loading && artists.length === 0 && (
        <div className="mt-6">
          <EmptyState title="No artists available for this style yet" message="Try a different style — new artists join every week." />
        </div>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {artists.map((a) => (
          <motion.button
            type="button"
            key={a.id}
            whileHover={{ y: -3 }}
            aria-pressed={value === a.id}
            onClick={() => onChange(a.id)}
            className={clsx('card flex items-center gap-4 p-4 text-left ring-2 transition', value === a.id ? 'ring-brand' : 'ring-transparent hover:shadow-md')}
          >
            <Avatar src={a.avatarUrl} name={a.displayName} size={60} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{a.displayName}</p>
              <p className="truncate text-xs text-gray-500">{a.styles.map((s) => s.name).join(' · ') || a.bio}</p>
              <p className="mt-1 text-xs text-gray-500">
                {a.customArtBasePrice ? (
                  <>
                    From <span className="font-semibold text-ink">{money(a.customArtBasePrice)}</span>
                  </>
                ) : (
                  'Quote on request'
                )}
                {a.ratingCount > 0 && ` · ★ ${a.ratingAverage.toFixed(1)}`}
              </p>
            </div>
            {value === a.id && (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-white">
                <Check size={15} />
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function CustomizeStep({ state, set, artistSlug }: { state: WizardState; set: (p: Partial<WizardState>) => void; artistSlug?: string }) {
  const works = useQuery({
    queryKey: ['artist', artistSlug, 'artworks', 'inspiration'],
    queryFn: () => artistsApi.artworks(artistSlug!, { pageSize: 12 }),
    enabled: !!artistSlug,
  });
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Make it yours</h2>
        <p className="mt-1 text-sm text-gray-500">The more detail you share, the closer the first preview will be.</p>
      </div>
      {!!works.data?.data.length && (
        <div>
          <p className="label">Inspiration from this artist (optional)</p>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {works.data.data.map((w) => (
              <button
                type="button"
                key={w.id}
                aria-pressed={state.selectedArtworkId === w.id}
                onClick={() => set({ selectedArtworkId: state.selectedArtworkId === w.id ? '' : w.id })}
                className={clsx('relative h-28 w-24 shrink-0 overflow-hidden rounded-xl ring-2', state.selectedArtworkId === w.id ? 'ring-brand' : 'ring-transparent')}
                title={w.title}
              >
                <img src={w.thumbnailUrl ?? w.imageUrl ?? ''} alt={w.title} className="h-full w-full object-cover" />
                {state.selectedArtworkId === w.id && (
                  <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-brand text-white">
                    <Check size={11} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="label" htmlFor="ca-title">
          Give it a name (optional)
        </label>
        <input id="ca-title" className="input" maxLength={120} value={state.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Our family portrait" />
      </div>
      <div>
        <label className="label" htmlFor="ca-instructions">
          Instructions *
        </label>
        <textarea
          id="ca-instructions"
          className="input min-h-32"
          maxLength={4000}
          value={state.instructions}
          onChange={(e) => set({ instructions: e.target.value })}
          placeholder="Convert this family photo into a traditional Indian watercolor painting with a temple background."
        />
        <p className="mt-1 text-xs text-gray-400">At least 10 characters · {state.instructions.length}/4000</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {CUSTOM_OPTIONS.map((o) => (
          <div key={o.key}>
            <label className="label" htmlFor={`opt-${o.key}`}>
              {o.label}
            </label>
            <input
              id={`opt-${o.key}`}
              className="input"
              maxLength={300}
              value={state.options[o.key] ?? ''}
              placeholder={o.placeholder}
              onChange={(e) => set({ options: { ...state.options, [o.key]: e.target.value } })}
            />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="label">Format</p>
          <div className="flex flex-wrap gap-2">
            {(['DIGITAL', 'PRINT', 'ORIGINAL'] as Format[]).map((f) => (
              <button type="button" key={f} aria-pressed={state.requestedFormat === f} onClick={() => set({ requestedFormat: f })} className={clsx('chip', state.requestedFormat === f && 'chip-active')}>
                {f === 'DIGITAL' ? 'Digital file' : f === 'PRINT' ? 'Print' : 'Original'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="ca-dim">
            Dimensions
          </label>
          <input id="ca-dim" className="input" value={state.requestedDimensions} onChange={(e) => set({ requestedDimensions: e.target.value })} placeholder="e.g. 45 × 60 cm" />
        </div>
        <div>
          <label className="label" htmlFor="ca-budget">
            Budget (₹)
          </label>
          <input
            id="ca-budget"
            className="input"
            inputMode="numeric"
            value={state.budget}
            onChange={(e) => set({ budget: e.target.value.replace(/\D/g, '') })}
            placeholder="Optional"
          />
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ state, style, artist, previews }: { state: WizardState; style?: TaxonomyItem; artist?: ArtistCard; previews: string[] }) {
  const opts = Object.entries(state.options).filter(([, v]) => v.trim());
  return (
    <div>
      <h2 className="text-2xl font-semibold">Review your request</h2>
      <p className="mt-1 text-sm text-gray-500">Nothing is charged now. Your artist will review and send a quote; you pay only after approving the preview.</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="grid grid-cols-3 gap-2">
          {previews.map((u, i) => (
            <img key={i} src={u} alt={`Photo ${i + 1}`} className="aspect-square rounded-xl object-cover" />
          ))}
        </div>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Style</dt>
            <dd className="font-semibold">{style?.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Artist</dt>
            <dd className="font-semibold">{artist?.displayName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Format</dt>
            <dd className="font-semibold capitalize">{state.requestedFormat.toLowerCase()}</dd>
          </div>
          {state.requestedDimensions && (
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Dimensions</dt>
              <dd className="font-semibold">{state.requestedDimensions}</dd>
            </div>
          )}
          {state.budget && (
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Budget</dt>
              <dd className="font-semibold">{money(Number(state.budget))}</dd>
            </div>
          )}
          {opts.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="capitalize text-gray-500">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">{state.instructions}</div>
    </div>
  );
}

export function canProceed(step: number, s: WizardState) {
  switch (step) {
    case 0:
      return s.photos.length > 0;
    case 1:
      return !!s.styleId;
    case 2:
      return !!s.artistId;
    case 3:
      return s.instructions.trim().length >= 10;
    default:
      return true;
  }
}

export function CreateYourArtWizard() {
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [state, setState] = useState<WizardState>({
    photos: [],
    styleId: params.get('style') ?? '',
    artistId: params.get('artist') ?? '',
    selectedArtworkId: params.get('artwork') ?? '',
    title: '',
    instructions: '',
    options: {},
    requestedDimensions: '',
    requestedFormat: 'DIGITAL',
    budget: '',
  });
  const set = (p: Partial<WizardState>) => setState((s) => ({ ...s, ...p }));

  const styles = useQuery({ queryKey: ['taxonomy', 'styles', 'custom'], queryFn: () => catalogApi.taxonomy('styles', { customArt: true }) });
  const artists = useQuery({ queryKey: ['custom-art', 'artists', state.styleId], queryFn: () => customArtApi.artists(state.styleId || undefined), enabled: step >= 2 || !!state.artistId });
  const style = styles.data?.find((s) => s.id === state.styleId);
  const artist = artists.data?.find((a) => a.id === state.artistId);
  const previews = useMemo(() => state.photos.map((f) => (typeof URL.createObjectURL === 'function' ? URL.createObjectURL(f) : '')), [state.photos]);

  const submit = useMutation<CustomArtDetail>({
    mutationFn: () =>
      customArtApi.create({
        photos: state.photos,
        artistId: state.artistId,
        styleId: state.styleId,
        selectedArtworkId: state.selectedArtworkId || undefined,
        title: state.title || undefined,
        instructions: state.instructions.trim(),
        options: Object.fromEntries(Object.entries(state.options).filter(([, v]) => v.trim())),
        requestedDimensions: state.requestedDimensions || undefined,
        requestedFormat: state.requestedFormat,
        budget: state.budget ? Number(state.budget) : undefined,
      }),
  });

  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  if (submit.isSuccess) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-xl py-16 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-brand to-magenta text-white">
          <Check size={36} />
        </motion.div>
        <h2 className="font-serif text-3xl">Your request is on its way!</h2>
        <p className="mt-3 text-gray-500">
          Request <span className="font-semibold text-ink">{submit.data.requestNumber}</span> was sent to {artist?.displayName ?? 'your artist'}. You’ll get a
          notification when they respond with a quote.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to={`/account/custom-art/${submit.data.id}`} className="btn-brand">
            Track my request
          </Link>
          <Link to="/gallery" className="btn-outline">
            Keep exploring
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <ol className="card relative z-10 mb-8 flex items-center justify-between gap-2 px-4 py-3 sm:px-6" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex flex-1 items-center gap-2">
            <motion.span
              initial={false}
              animate={{ scale: i === step ? 1.1 : 1, backgroundColor: i <= step ? 'var(--color-brand)' : '#f3f4f6', color: i <= step ? '#fff' : '#9ca3af' }}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
              aria-current={i === step ? 'step' : undefined}
            >
              {i < step ? <Check size={17} /> : <s.icon size={17} />}
            </motion.span>
            <span className={clsx('hidden text-xs font-semibold md:block', i <= step ? 'text-ink' : 'text-gray-400')}>{s.title}</span>
            {i < STEPS.length - 1 && (
              <span className="relative mx-1 h-0.5 flex-1 overflow-hidden rounded bg-gray-100">
                <motion.span className="absolute inset-y-0 left-0 bg-brand" animate={{ width: i < step ? '100%' : '0%' }} transition={{ duration: 0.5 }} />
              </span>
            )}
          </li>
        ))}
      </ol>

      <div className="card overflow-hidden p-6 sm:p-10">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -50 }} transition={{ duration: 0.35 }}>
            {step === 0 && <PhotoStep photos={state.photos} onChange={(photos) => set({ photos })} />}
            {step === 1 && <StyleStep styles={styles.data ?? []} loading={styles.isLoading} value={state.styleId} onChange={(styleId) => set({ styleId })} />}
            {step === 2 && <ArtistStep artists={artists.data ?? []} loading={artists.isLoading} value={state.artistId} onChange={(artistId) => set({ artistId, selectedArtworkId: '' })} />}
            {step === 3 && <CustomizeStep state={state} set={set} artistSlug={artist?.slug} />}
            {step === 4 && <ReviewStep state={state} style={style} artist={artist} previews={previews} />}
          </motion.div>
        </AnimatePresence>

        {submit.isError && (
          <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
            {errorMessage(submit.error)}
          </p>
        )}

        <div className="mt-10 flex items-center justify-between">
          <button type="button" className="btn-outline" disabled={step === 0} onClick={() => go(step - 1)}>
            <ArrowLeft size={16} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn-brand" disabled={!canProceed(step, state)} onClick={() => go(step + 1)}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="btn-brand" disabled={submit.isPending} onClick={() => submit.mutate()}>
              <Sparkles size={16} /> {submit.isPending ? 'Sending…' : 'Submit request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateYourArtPage() {
  const { user, ready } = useAuth();
  return (
    <>
      <section className="relative overflow-hidden bg-ink pb-24 pt-32 text-center text-white">
        <div className="hero-fallback absolute inset-0 opacity-50" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 to-ink" aria-hidden />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="container-x relative">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-light">Create Your Art</p>
          <h1 className="font-script text-6xl sm:text-7xl">Turn Your Photo Into Art</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">Upload a photo, pick a style and an artist — and watch a memory become a painting.</p>
        </motion.div>
      </section>
      <div className="container-x -mt-12 pb-24">
        {!ready ? (
          <Skeleton className="mx-auto h-96 max-w-4xl" />
        ) : user ? (
          <CreateYourArtWizard />
        ) : (
          <div className="card relative mx-auto max-w-xl p-10 text-center">
            <Lock className="mx-auto mb-4 text-brand" size={32} />
            <h2 className="text-2xl font-semibold">Sign in to start your commission</h2>
            <p className="mt-2 text-sm text-gray-500">We keep your photos private to your account, so you’ll need to sign in before uploading.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/login?next=/create-your-art" className="btn-brand">
                Sign in
              </Link>
              <Link to="/register?next=/create-your-art" className="btn-outline">
                Create account
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

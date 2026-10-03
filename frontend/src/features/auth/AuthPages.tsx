import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'motion/react';
import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Check, Clock, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/layouts/Navbar';
import { catalogApi } from '@/features/artworks/api';
import { errorMessage } from '@/lib/api';
import type { AuthUser } from '@/lib/types';
import { useAuth } from './AuthContext';

function AuthShell({ title, subtitle, children, wide }: { title: string; subtitle: ReactNode; children: ReactNode; wide?: boolean }) {
  const home = useQuery({ queryKey: ['home'], queryFn: catalogApi.home, staleTime: 300_000 });
  const art = home.data?.featuredArtworks[0] ?? home.data?.trendingArtworks[0];
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        {art?.imageUrl ? (
          <motion.img initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 2 }} src={art.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
        ) : (
          <div className="hero-fallback absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/40" />
        <div className="absolute left-10 top-8">
          <Logo />
        </div>
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="font-script text-5xl">Art That Tells Your Story</p>
          {art && (
            <p className="mt-3 text-sm text-white/70">
              “{art.title}” by {art.artist.displayName}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={clsx('w-full', wide ? 'max-w-2xl' : 'max-w-md')}>
          <div className="mb-8 lg:hidden">
            <Logo light={false} />
          </div>
          <h1 className="font-serif text-3xl font-medium">{title}</h1>
          <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? 'text' : 'password'} className={clsx('input pr-11', props.className)} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

const Err = ({ msg }: { msg?: string }) => (msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null);

export function redirectFor(user: AuthUser, next: string | null) {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  if (user.roles.includes('ADMIN')) return '/admin';
  if (user.roles.includes('ARTIST')) return '/seller';
  return '/';
}

const loginSchema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') });

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  const onSubmit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      const user = await login(v.email, v.password);
      navigate(redirectFor(user, params.get('next')), { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        <>
          New here?{' '}
          <Link to={`/register${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`} className="font-semibold text-brand">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" autoComplete="email" className="input" {...form.register('email')} />
          <Err msg={form.formState.errors.email?.message} />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <PasswordInput id="password" autoComplete="current-password" {...form.register('password')} />
          <Err msg={form.formState.errors.password?.message} />
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button className="btn-brand w-full !py-3" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-center text-xs text-gray-500">
          Are you an artist?{' '}
          <Link to="/register/artist" className="font-semibold text-brand">
            Open your gallery
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export const passwordRule = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/[0-9]/, 'Add a number');

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().trim().optional(),
  password: passwordRule,
});

export function RegisterPage() {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema) });
  const onSubmit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      const user = await signup({ ...v, phone: v.phone || undefined });
      navigate(redirectFor(user, params.get('next')), { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  const e = form.formState.errors;
  return (
    <AuthShell
      title="Join the gallery"
      subtitle={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="fullName">
            Full name
          </label>
          <input id="fullName" autoComplete="name" className="input" {...form.register('fullName')} />
          <Err msg={e.fullName?.message} />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" autoComplete="email" className="input" {...form.register('email')} />
          <Err msg={e.email?.message} />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone (optional)
          </label>
          <input id="phone" autoComplete="tel" className="input" {...form.register('phone')} />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <PasswordInput id="password" autoComplete="new-password" {...form.register('password')} />
          <Err msg={e.password?.message} />
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button className="btn-brand w-full !py-3" disabled={form.formState.isSubmitting}>
          Create account
        </button>
        <p className="text-center text-xs text-gray-500">
          Want to sell your art?{' '}
          <Link to="/register/artist" className="font-semibold text-brand">
            Register as an artist
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

const artistSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().trim().optional(),
  password: passwordRule,
  displayName: z.string().trim().min(2, 'Enter your artist or gallery name'),
  artistType: z.enum(['INDIVIDUAL', 'STUDIO', 'GALLERY', 'CREATIVE_BUSINESS']),
  bio: z.string().trim().max(500).optional(),
  description: z.string().trim().max(5000).optional(),
  yearsOfExperience: z.string().optional(),
  country: z.string().trim().min(2),
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
  website: z.union([z.literal(''), z.string().url('Enter a full URL starting with https://')]).optional(),
  instagram: z.union([z.literal(''), z.string().url('Enter a full URL')]).optional(),
  artistStatement: z.string().trim().max(5000).optional(),
  primaryCategoryId: z.string().optional(),
  specializations: z.string().optional(),
  awards: z.string().optional(),
  acceptsCustomArt: z.boolean(),
});
type ArtistForm = z.infer<typeof artistSchema>;

const ARTIST_STEPS: { title: string; fields: (keyof ArtistForm)[] }[] = [
  { title: 'Personal', fields: ['fullName', 'email', 'phone', 'password'] },
  { title: 'Gallery', fields: ['displayName', 'artistType', 'bio', 'description', 'yearsOfExperience', 'country', 'state', 'city', 'address', 'website', 'instagram'] },
  { title: 'Professional', fields: ['primaryCategoryId', 'specializations', 'awards', 'artistStatement', 'acceptsCustomArt'] },
];

export function ArtistRegisterPage() {
  const { registerArtist, user } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [styleIds, setStyleIds] = useState<string[]>([]);
  const [mediumIds, setMediumIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const categories = useQuery({ queryKey: ['taxonomy', 'categories'], queryFn: () => catalogApi.taxonomy('categories') });
  const styles = useQuery({ queryKey: ['taxonomy', 'styles'], queryFn: () => catalogApi.taxonomy('styles') });
  const mediums = useQuery({ queryKey: ['taxonomy', 'mediums'], queryFn: () => catalogApi.taxonomy('mediums') });
  const form = useForm<ArtistForm>({ resolver: zodResolver(artistSchema), defaultValues: { artistType: 'INDIVIDUAL', country: 'IN', acceptsCustomArt: true } });
  const e = form.formState.errors;

  const next = async () => {
    if (await form.trigger(ARTIST_STEPS[step].fields)) setStep((s) => s + 1);
  };

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    const list = (s?: string) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);
    try {
      await registerArtist({
        fullName: v.fullName,
        email: v.email,
        phone: v.phone || undefined,
        password: v.password,
        displayName: v.displayName,
        artistType: v.artistType,
        bio: v.bio || undefined,
        description: v.description || undefined,
        artistStatement: v.artistStatement || undefined,
        yearsOfExperience: v.yearsOfExperience ? Number(v.yearsOfExperience) : undefined,
        country: v.country,
        state: v.state || undefined,
        city: v.city || undefined,
        address: v.address || undefined,
        website: v.website || undefined,
        socialLinks: v.instagram ? { instagram: v.instagram } : undefined,
        primaryCategoryId: v.primaryCategoryId || undefined,
        styleIds,
        mediumIds,
        specializations: list(v.specializations),
        awards: list(v.awards),
        acceptsCustomArt: v.acceptsCustomArt,
      });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  });

  if (done || (user?.artistStatus === 'PENDING_APPROVAL' && !form.formState.isSubmitting && step === 0 && !form.formState.isDirty)) {
    return (
      <AuthShell title="Your gallery is under review" subtitle="Thank you for joining MyMoons Gallery.">
        <div className="space-y-5">
          <div className="flex gap-3 rounded-2xl bg-amber-50 p-5 text-amber-800">
            <Clock className="shrink-0" />
            <p className="text-sm">
              Our curators review every new artist to keep the gallery authentic. You can already set up your profile and prepare artwork drafts — they
              can be published once your account is approved. We’ll notify you as soon as it’s done.
            </p>
          </div>
          <Link to="/seller" className="btn-brand w-full !py-3">
            Go to my artist dashboard
          </Link>
        </div>
      </AuthShell>
    );
  }

  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <AuthShell
      wide
      title="Open your gallery"
      subtitle={
        <>
          Sell originals, prints and digital art, and accept custom photo-to-art commissions. Already registered?{' '}
          <Link to="/login?next=/seller" className="font-semibold text-brand">
            Sign in
          </Link>
        </>
      }
    >
      <ol className="mb-8 flex gap-2">
        {ARTIST_STEPS.map((s, i) => (
          <li key={s.title} className="flex-1">
            <div className={clsx('h-1.5 rounded-full transition', i <= step ? 'bg-brand' : 'bg-gray-100')} />
            <p className={clsx('mt-2 text-xs font-semibold', i <= step ? 'text-brand' : 'text-gray-400')}>
              {i + 1}. {s.title}
            </p>
          </li>
        ))}
      </ol>
      <form onSubmit={submit} noValidate>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="grid gap-4 sm:grid-cols-2">
            {step === 0 && (
              <>
                <div>
                  <label className="label" htmlFor="a-name">
                    Full name *
                  </label>
                  <input id="a-name" className="input" {...form.register('fullName')} />
                  <Err msg={e.fullName?.message} />
                </div>
                <div>
                  <label className="label" htmlFor="a-phone">
                    Phone
                  </label>
                  <input id="a-phone" className="input" {...form.register('phone')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="a-email">
                    Email *
                  </label>
                  <input id="a-email" type="email" className="input" {...form.register('email')} />
                  <Err msg={e.email?.message} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="a-pass">
                    Password *
                  </label>
                  <PasswordInput id="a-pass" autoComplete="new-password" {...form.register('password')} />
                  <Err msg={e.password?.message} />
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <div>
                  <label className="label" htmlFor="a-display">
                    Artist / gallery name *
                  </label>
                  <input id="a-display" className="input" {...form.register('displayName')} />
                  <Err msg={e.displayName?.message} />
                </div>
                <div>
                  <label className="label" htmlFor="a-type">
                    You are
                  </label>
                  <select id="a-type" className="input" {...form.register('artistType')}>
                    <option value="INDIVIDUAL">Individual artist</option>
                    <option value="STUDIO">Art studio</option>
                    <option value="GALLERY">Art gallery</option>
                    <option value="CREATIVE_BUSINESS">Creative business</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="a-bio">
                    Short bio
                  </label>
                  <input id="a-bio" className="input" maxLength={500} placeholder="One line collectors will see first" {...form.register('bio')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="a-desc">
                    About you
                  </label>
                  <textarea id="a-desc" className="input min-h-24" {...form.register('description')} />
                </div>
                <div>
                  <label className="label" htmlFor="a-years">
                    Years of experience
                  </label>
                  <input id="a-years" inputMode="numeric" className="input" {...form.register('yearsOfExperience')} />
                </div>
                <div>
                  <label className="label" htmlFor="a-country">
                    Country
                  </label>
                  <input id="a-country" className="input" {...form.register('country')} />
                </div>
                <div>
                  <label className="label" htmlFor="a-state">
                    State
                  </label>
                  <input id="a-state" className="input" {...form.register('state')} />
                </div>
                <div>
                  <label className="label" htmlFor="a-city">
                    City
                  </label>
                  <input id="a-city" className="input" {...form.register('city')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="a-address">
                    Studio address (private)
                  </label>
                  <input id="a-address" className="input" {...form.register('address')} />
                </div>
                <div>
                  <label className="label" htmlFor="a-web">
                    Website
                  </label>
                  <input id="a-web" className="input" placeholder="https://" {...form.register('website')} />
                  <Err msg={e.website?.message} />
                </div>
                <div>
                  <label className="label" htmlFor="a-ig">
                    Instagram
                  </label>
                  <input id="a-ig" className="input" placeholder="https://instagram.com/…" {...form.register('instagram')} />
                  <Err msg={e.instagram?.message} />
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="a-cat">
                    Primary category
                  </label>
                  <select id="a-cat" className="input" {...form.register('primaryCategoryId')}>
                    <option value="">Choose…</option>
                    {categories.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <p className="label">Art styles</p>
                  <div className="flex flex-wrap gap-2">
                    {styles.data?.map((s) => (
                      <button type="button" key={s.id} aria-pressed={styleIds.includes(s.id)} onClick={() => toggle(styleIds, setStyleIds, s.id)} className={clsx('chip', styleIds.includes(s.id) && 'chip-active')}>
                        {styleIds.includes(s.id) && <Check size={11} className="mr-1" />} {s.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="label">Mediums</p>
                  <div className="flex flex-wrap gap-2">
                    {mediums.data?.map((m) => (
                      <button type="button" key={m.id} aria-pressed={mediumIds.includes(m.id)} onClick={() => toggle(mediumIds, setMediumIds, m.id)} className={clsx('chip', mediumIds.includes(m.id) && 'chip-active')}>
                        {mediumIds.includes(m.id) && <Check size={11} className="mr-1" />} {m.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="a-spec">
                    Specializations
                  </label>
                  <input id="a-spec" className="input" placeholder="Comma separated, e.g. pet portraits, murals" {...form.register('specializations')} />
                </div>
                <div>
                  <label className="label" htmlFor="a-awards">
                    Awards / achievements
                  </label>
                  <input id="a-awards" className="input" placeholder="Comma separated" {...form.register('awards')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="a-statement">
                    Artist statement
                  </label>
                  <textarea id="a-statement" className="input min-h-24" {...form.register('artistStatement')} />
                </div>
                <label className="flex items-center gap-3 text-sm sm:col-span-2">
                  <input type="checkbox" className="h-4 w-4 accent-brand" {...form.register('acceptsCustomArt')} />I accept custom photo-to-art commissions
                </label>
                <p className="text-xs text-gray-500 sm:col-span-2">You can upload your portfolio, avatar and cover image from your dashboard after registering.</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-8 flex justify-between">
          <button type="button" className="btn-outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft size={16} /> Back
          </button>
          {step < ARTIST_STEPS.length - 1 ? (
            <button type="button" className="btn-brand" onClick={next}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button type="submit" className="btn-brand" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Submitting…' : 'Submit for approval'}
            </button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}

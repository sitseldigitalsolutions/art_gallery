/**
 * Website configuration managed by admins (mirrors backend/src/modules/site-config/site-config.schema.ts).
 * DEFAULT_SITE_CONFIG must stay identical to the zod defaults so the site renders the same
 * before the API responds or if it is unreachable.
 */

export const HOME_SECTION_IDS = [
  'filterCard',
  'categories',
  'featured',
  'perfectArt',
  'styles',
  'photoToArt',
  'trending',
  'recommended',
  'collections',
  'artists',
  'newArrivals',
  'newArtists',
  'recentlyViewed',
  'testimonials',
] as const;
export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

/** Admin-facing names and descriptions for each homepage section. */
export const SECTION_META: Record<HomeSectionId, { label: string; description: string }> = {
  filterCard: { label: 'Search & filter card', description: 'Quick art-type, price, style and medium filters (overlaps the hero when first).' },
  categories: { label: 'Category mosaic', description: 'Large image tiles for the main categories.' },
  featured: { label: 'Featured carousel (Best of the year)', description: 'Hand-picked featured artworks.' },
  perfectArt: { label: '“Find your Perfect Art” band', description: 'Dark band with statistics counters.' },
  styles: { label: 'Explore art styles', description: 'Scrollable row of style cards.' },
  photoToArt: { label: 'Turn Your Photo Into Art', description: 'The custom photo-to-art feature showcase.' },
  trending: { label: 'Trending artwork', description: 'Masonry grid of trending pieces.' },
  recommended: { label: 'Recommended for you', description: 'Personal picks for signed-in visitors.' },
  collections: { label: 'Collections', description: 'Curated and artist collections.' },
  artists: { label: 'Featured artists', description: 'Artist portrait grid.' },
  newArrivals: { label: 'New arrivals carousel', description: 'Most recently published artworks.' },
  newArtists: { label: 'New artists', description: 'Recently joined artists.' },
  recentlyViewed: { label: 'Recently viewed', description: 'Shown to signed-in visitors who browsed artworks.' },
  testimonials: { label: 'Customer stories', description: 'Rotating testimonials from reviews.' },
};

export const THEME_PRESETS = {
  'royal-purple': { primary: '#8b2bd9', primaryDark: '#7a1fc7', accent: '#ff4fa3', accent2: '#ff8a3d', accent3: '#18c3c9', ink: '#0b0a12' },
  'midnight-teal': { primary: '#0f9d9a', primaryDark: '#0b7c7a', accent: '#22d3ee', accent2: '#f59e0b', accent3: '#a78bfa', ink: '#081316' },
  'sunset-coral': { primary: '#e8505b', primaryDark: '#c93d48', accent: '#f9a03f', accent2: '#ffd166', accent3: '#7b2cbf', ink: '#1a0f14' },
  'emerald-gold': { primary: '#0f7b5f', primaryDark: '#0b624b', accent: '#d4a72c', accent2: '#e76f51', accent3: '#2a9d8f', ink: '#0a1410' },
  'royal-blue': { primary: '#2f5bea', primaryDark: '#2447c2', accent: '#ff6b9a', accent2: '#ffb020', accent3: '#22c1c3', ink: '#0a0e1f' },
  monochrome: { primary: '#1f1f1f', primaryDark: '#000000', accent: '#9a9a9a', accent2: '#c9a227', accent3: '#6b7280', ink: '#0b0b0b' },
} as const;
export type ThemePreset = keyof typeof THEME_PRESETS;
export type ThemeColors = (typeof THEME_PRESETS)[ThemePreset];

export interface HomeSectionConfig {
  id: HomeSectionId;
  enabled: boolean;
  title: string;
  subtitle: string;
}

export type HeroEffect = 'fade' | 'slide' | 'zoom' | 'kenburns';

export interface SiteConfig {
  branding: { siteName: string; tagline: string; scriptLogo: boolean };
  theme: {
    preset: ThemePreset | 'custom';
    primary: string;
    primaryDark: string;
    accent: string;
    accent2: string;
    accent3: string;
    ink: string;
    radius: 'sharp' | 'soft' | 'round';
    headingFont: 'Montserrat' | 'Playfair Display';
    scriptFont: 'Great Vibes' | 'Pinyon Script' | 'Playfair Display';
  };
  hero: {
    enabled: boolean;
    autoplay: boolean;
    intervalSeconds: number;
    effect: HeroEffect;
    overlayOpacity: number;
    height: 'full' | 'large' | 'medium';
    showSearch: boolean;
    showParticles: boolean;
    useBannerText: boolean;
    eyebrow: string;
    headline: string;
    subheadline: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  homeSections: HomeSectionConfig[];
  announcement: { enabled: boolean; text: string; href: string; tone: 'brand' | 'dark' | 'accent' };
  animations: { enabled: boolean; intensity: 'subtle' | 'normal' | 'lively'; pageTransitions: boolean };
  contact: { email: string; phone: string; address: string; hours: string };
  social: { instagram: string; facebook: string; twitter: string; youtube: string; pinterest: string; whatsapp: string };
  footer: { about: string; newsletterEnabled: boolean; showChatWidget: boolean; copyright: string };
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  branding: { siteName: 'MyMoons Gallery', tagline: 'Original art & custom portraits', scriptLogo: true },
  theme: { preset: 'royal-purple', ...THEME_PRESETS['royal-purple'], radius: 'round', headingFont: 'Montserrat', scriptFont: 'Great Vibes' },
  hero: {
    enabled: true,
    autoplay: true,
    intervalSeconds: 7,
    effect: 'kenburns',
    overlayOpacity: 45,
    height: 'full',
    showSearch: true,
    showParticles: true,
    useBannerText: false,
    eyebrow: 'Original art · Custom portraits',
    headline: 'Art That Tells Your Story',
    subheadline: 'Discover original artworks or transform your favorite memories into beautiful art.',
    primaryCtaLabel: 'Explore Gallery',
    primaryCtaHref: '/gallery',
    secondaryCtaLabel: 'Create Your Art',
    secondaryCtaHref: '/create-your-art',
  },
  homeSections: HOME_SECTION_IDS.map((id) => ({ id, enabled: true, title: '', subtitle: '' })),
  announcement: { enabled: false, text: 'Free shipping on original paintings this month', href: '', tone: 'brand' },
  animations: { enabled: true, intensity: 'normal', pageTransitions: true },
  contact: { email: 'hello@mymoonsgallery.com', phone: '', address: 'India', hours: 'Mon–Sat, 10am–7pm IST' },
  social: { instagram: '', facebook: '', twitter: '', youtube: '', pinterest: '', whatsapp: '' },
  footer: {
    about:
      'MyMoons Gallery is an online home for independent artists and galleries. Discover original paintings, prints and digital art — or commission an artist to turn your favourite photo into a one-of-a-kind artwork.',
    newsletterEnabled: true,
    showChatWidget: true,
    copyright: 'All artworks remain the copyright of their artists.',
  },
};

/** Fill gaps in a (possibly partial / older) config so the UI can always rely on every field. */
export function normalizeSiteConfig(input: Partial<SiteConfig> | null | undefined): SiteConfig {
  const d = DEFAULT_SITE_CONFIG;
  const c = input ?? {};
  const seen = new Set<HomeSectionId>();
  const sections: HomeSectionConfig[] = [];
  for (const s of c.homeSections ?? d.homeSections) {
    if (!HOME_SECTION_IDS.includes(s.id) || seen.has(s.id)) continue;
    seen.add(s.id);
    sections.push({ ...{ enabled: true, title: '', subtitle: '' }, ...s });
  }
  for (const id of HOME_SECTION_IDS) if (!seen.has(id)) sections.push({ id, enabled: true, title: '', subtitle: '' });
  return {
    branding: { ...d.branding, ...c.branding },
    theme: { ...d.theme, ...c.theme },
    hero: { ...d.hero, ...c.hero },
    homeSections: sections,
    announcement: { ...d.announcement, ...c.announcement },
    animations: { ...d.animations, ...c.animations },
    contact: { ...d.contact, ...c.contact },
    social: { ...d.social, ...c.social },
    footer: { ...d.footer, ...c.footer },
  };
}

/** Mix a hex colour with white (amount 0–1 of white). */
export function tint(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * amount));
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export const RADIUS_SCALE: Record<SiteConfig['theme']['radius'], { xl: string; '2xl': string; '3xl': string; button: string; antd: number }> = {
  sharp: { xl: '0.25rem', '2xl': '0.375rem', '3xl': '0.5rem', button: '0.375rem', antd: 4 },
  soft: { xl: '0.5rem', '2xl': '0.75rem', '3xl': '1rem', button: '0.75rem', antd: 8 },
  round: { xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem', button: '9999px', antd: 10 },
};

/** Apply theme colours / radius / fonts as CSS variables (Tailwind v4 utilities read these). */
export function applyThemeVariables(theme: SiteConfig['theme'], root: HTMLElement = document.documentElement) {
  const r = RADIUS_SCALE[theme.radius] ?? RADIUS_SCALE.round;
  const vars: Record<string, string> = {
    '--color-brand': theme.primary,
    '--color-brand-dark': theme.primaryDark,
    '--color-brand-light': tint(theme.primary, 0.9),
    '--color-magenta': theme.accent,
    '--color-sunset': theme.accent2,
    '--color-teal': theme.accent3,
    '--color-ink': theme.ink,
    '--color-ink-2': tint(theme.ink, 0.04),
    '--color-ink-3': tint(theme.ink, 0.1),
    '--radius-xl': r.xl,
    '--radius-2xl': r['2xl'],
    '--radius-3xl': r['3xl'],
    '--btn-radius': r.button,
    '--font-script': `'${theme.scriptFont}', cursive`,
    '--font-heading': `'${theme.headingFont}', ui-sans-serif, system-ui, sans-serif`,
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
}

export const isExternalHref = (href: string) => /^(https?:|mailto:)/i.test(href);

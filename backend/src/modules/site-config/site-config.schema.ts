import { z } from 'zod';

/**
 * Admin-managed website configuration (theme, homepage layout, hero carousel, content values).
 * Stored as one JSON document in SystemSetting "site.config"; every field has a default so a
 * partially-saved or older document is always upgraded to a complete, valid config.
 */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex colour like #8b2bd9');
/** Links must be site-relative paths or http(s) URLs — never javascript:/data: (XSS). */
const href = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || /^\/(?!\/)/.test(v) || /^https?:\/\//i.test(v) || /^mailto:/i.test(v), 'Use a path like /gallery or an https:// URL');
const text = (max: number) => z.string().trim().max(max);

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

const SECTION_DEFAULT_TITLES: Record<HomeSectionId, string> = {
  filterCard: 'Find your art',
  categories: 'Category',
  featured: 'Best of the Year',
  perfectArt: 'Find your Perfect Art',
  styles: 'Explore Art Styles',
  photoToArt: 'Turn Your Photo Into Art',
  trending: 'Trending Artwork',
  recommended: 'Recommended for you',
  collections: 'More Collections',
  artists: 'Artists',
  newArrivals: 'New Arrivals',
  newArtists: 'New Artists',
  recentlyViewed: 'Recently viewed',
  testimonials: 'Customer Stories',
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

const sectionSchema = z.object({
  id: z.enum(HOME_SECTION_IDS),
  enabled: z.boolean().default(true),
  title: text(80).default(''),
  subtitle: text(200).default(''),
});

export const siteConfigSchema = z.object({
  branding: z
    .object({
      siteName: text(60).min(1).default('MyMoons Gallery'),
      tagline: text(120).default('Original art & custom portraits'),
      scriptLogo: z.boolean().default(true),
    })
    .prefault({}),
  theme: z
    .object({
      preset: z.enum([...(Object.keys(THEME_PRESETS) as [ThemePreset, ...ThemePreset[]]), 'custom']).default('royal-purple'),
      primary: hex.default(THEME_PRESETS['royal-purple'].primary),
      primaryDark: hex.default(THEME_PRESETS['royal-purple'].primaryDark),
      accent: hex.default(THEME_PRESETS['royal-purple'].accent),
      accent2: hex.default(THEME_PRESETS['royal-purple'].accent2),
      accent3: hex.default(THEME_PRESETS['royal-purple'].accent3),
      ink: hex.default(THEME_PRESETS['royal-purple'].ink),
      radius: z.enum(['sharp', 'soft', 'round']).default('round'),
      headingFont: z.enum(['Montserrat', 'Playfair Display']).default('Montserrat'),
      scriptFont: z.enum(['Great Vibes', 'Pinyon Script', 'Playfair Display']).default('Great Vibes'),
    })
    .prefault({}),
  hero: z
    .object({
      enabled: z.boolean().default(true),
      autoplay: z.boolean().default(true),
      intervalSeconds: z.number().int().min(3).max(30).default(7),
      effect: z.enum(['fade', 'slide', 'zoom', 'kenburns']).default('kenburns'),
      overlayOpacity: z.number().int().min(0).max(90).default(45),
      height: z.enum(['full', 'large', 'medium']).default('full'),
      showSearch: z.boolean().default(true),
      showParticles: z.boolean().default(true),
      /** Use each banner's own title/subtitle/link; otherwise the fixed texts below. */
      useBannerText: z.boolean().default(false),
      eyebrow: text(60).default('Original art · Custom portraits'),
      headline: text(80).min(1).default('Art That Tells Your Story'),
      subheadline: text(220).default('Discover original artworks or transform your favorite memories into beautiful art.'),
      primaryCtaLabel: text(40).default('Explore Gallery'),
      primaryCtaHref: href.default('/gallery'),
      secondaryCtaLabel: text(40).default('Create Your Art'),
      secondaryCtaHref: href.default('/create-your-art'),
    })
    .prefault({}),
  homeSections: z
    .array(sectionSchema)
    .max(HOME_SECTION_IDS.length)
    .default(HOME_SECTION_IDS.map((id) => ({ id, enabled: true, title: '', subtitle: '' })))
    // Drop duplicates, then append any section the stored document doesn't know about yet.
    .transform((sections) => {
      const seen = new Set<HomeSectionId>();
      const out = sections.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
      for (const id of HOME_SECTION_IDS) if (!seen.has(id)) out.push({ id, enabled: true, title: '', subtitle: '' });
      return out;
    }),
  announcement: z
    .object({
      enabled: z.boolean().default(false),
      text: text(160).default('Free shipping on original paintings this month'),
      href: href.default(''),
      tone: z.enum(['brand', 'dark', 'accent']).default('brand'),
    })
    .prefault({}),
  animations: z
    .object({
      enabled: z.boolean().default(true),
      intensity: z.enum(['subtle', 'normal', 'lively']).default('normal'),
      pageTransitions: z.boolean().default(true),
    })
    .prefault({}),
  contact: z
    .object({
      email: z.union([z.literal(''), z.string().trim().email().max(120)]).default('hello@mymoonsgallery.com'),
      phone: text(40).default(''),
      address: text(200).default('India'),
      hours: text(80).default('Mon–Sat, 10am–7pm IST'),
    })
    .prefault({}),
  social: z
    .object({
      instagram: href.default(''),
      facebook: href.default(''),
      twitter: href.default(''),
      youtube: href.default(''),
      pinterest: href.default(''),
      whatsapp: href.default(''),
    })
    .prefault({}),
  footer: z
    .object({
      about: text(600).default(
        'MyMoons Gallery is an online home for independent artists and galleries. Discover original paintings, prints and digital art — or commission an artist to turn your favourite photo into a one-of-a-kind artwork.',
      ),
      newsletterEnabled: z.boolean().default(true),
      showChatWidget: z.boolean().default(true),
      copyright: text(160).default('All artworks remain the copyright of their artists.'),
    })
    .prefault({}),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;

export const defaultSiteConfig = (): SiteConfig => siteConfigSchema.parse({});
export const sectionDefaultTitles = SECTION_DEFAULT_TITLES;

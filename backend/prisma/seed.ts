/**
 * Seed: reference data (always upserted) + demo content (only when the catalogue is empty).
 * All demo images are generated procedurally — no external or copyrighted assets.
 *
 *   npm run seed
 */
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { Prisma, type ArtworkFormat, type ArtworkType, type CustomArtStatus, type Orientation, type RoleName } from '@prisma/client';
import { config } from '../src/config/env.js';
import { prisma } from '../src/database/prisma/client.js';
import { computeLine, loadCommissionRules, resolveCommission } from '../src/modules/finance/commission.js';
import { storage, type StorageArea } from '../src/providers/storage/index.js';
import { fromMinor } from '../src/utils/money.js';
import { referenceCode, slugify, uniqueSlug } from '../src/utils/slug.js';
import { Ctx, PALETTES, avatar, generate, mulberry32, treeOfLife, type Kind, type PaletteKey } from './art-generator.js';

// ───────────────────────────── Reference data ─────────────────────────────

const CATEGORIES: Array<[string, string, Kind, PaletteKey]> = [
  ['Paintings', 'Original paintings in oil, acrylic and watercolour, signed by the artist.', 'landscape', 'sunset'],
  ['Portraits', 'Expressive portraits that capture character, emotion and story.', 'portrait', 'purple'],
  ['Abstract Art', 'Colour, gesture and form freed from the literal.', 'abstract', 'carnival'],
  ['Digital Art', 'Contemporary works created with digital brushes and tools.', 'pop', 'indigo'],
  ['Photography', 'Fine-art photography and limited edition photographic prints.', 'landscape', 'ocean'],
  ['Illustrations', 'Narrative illustration, ink work and editorial art.', 'lineart', 'earth'],
  ['Sculptures', 'Three-dimensional works in stone, metal, wood and clay.', 'abstract', 'mono'],
  ['Calligraphy', 'The art of beautiful lettering across scripts and traditions.', 'lineart', 'crimson'],
  ['Traditional Art', 'Heritage techniques passed down through generations.', 'mandala', 'crimson'],
  ['Modern Art', 'Bold modernist experiments in colour and composition.', 'pop', 'carnival'],
  ['Contemporary Art', 'Art of our time — ideas, materials and voices of today.', 'abstract', 'purple'],
  ['Minimalist Art', 'Quiet compositions where less becomes more.', 'lineart', 'pastel'],
  ['Landscape Art', 'Mountains, rivers, skies and cities seen through an artist’s eye.', 'landscape', 'forest'],
  ['Religious Art', 'Devotional and spiritual works from many faiths.', 'mandala', 'sunset'],
  ['Cultural Art', 'Folk forms, festivals and the stories of communities.', 'mandala', 'indigo'],
  ['Wall Art', 'Statement pieces sized and framed for your walls.', 'tree', 'carnival'],
  ['Custom Art', 'Commission personalised artwork from your own photos.', 'portrait', 'sunset'],
];

const STYLES: Array<[string, string, Kind, PaletteKey]> = [
  ['Realistic', 'True-to-life rendering with careful light and detail.', 'landscape', 'ocean'],
  ['Abstract', 'Non-representational colour and form.', 'abstract', 'carnival'],
  ['Minimalist', 'Pared-back shapes and calm negative space.', 'lineart', 'pastel'],
  ['Modern', 'Clean, bold, twentieth-century inspired.', 'pop', 'sunset'],
  ['Contemporary', 'Fresh, current and experimental.', 'abstract', 'purple'],
  ['Vintage', 'Nostalgic palettes and aged textures.', 'lineart', 'earth'],
  ['Watercolor', 'Luminous washes and soft blooms of colour.', 'landscape', 'teal'],
  ['Oil Painting', 'Rich, layered, painterly texture.', 'landscape', 'sunset'],
  ['Pencil Sketch', 'Graphite line and delicate shading.', 'sketch', 'mono'],
  ['Charcoal', 'Dramatic smudged darks and lights.', 'sketch', 'mono'],
  ['Digital Painting', 'Painterly works made on screen.', 'portrait', 'indigo'],
  ['Pop Art', 'Punchy colour, halftones and outlines.', 'pop', 'carnival'],
  ['Cartoon', 'Playful, simplified, character-driven.', 'pop', 'sunset'],
  ['Anime', 'Japanese animation inspired portraits.', 'portrait', 'pastel'],
  ['Line Art', 'Expressive single-weight line drawing.', 'lineart', 'earth'],
  ['Mandala', 'Radial sacred geometry.', 'mandala', 'purple'],
  ['Traditional Indian Art', 'Madhubani, Tanjore, Pichwai and other Indian traditions.', 'mandala', 'crimson'],
  ['Folk Art', 'Community art forms and storytelling motifs.', 'mandala', 'sunset'],
];

const MEDIUMS = ['Oil', 'Acrylic', 'Watercolor', 'Pencil', 'Charcoal', 'Ink', 'Canvas', 'Digital', 'Mixed Media', 'Pastel', 'Wood', 'Paper', 'Metal', 'Other'];
const THEMES = ['Nature', 'Heritage', 'Spiritual', 'Festival', 'Urban', 'Love & Family', 'Wildlife', 'Monochrome'];

const PERMISSIONS: Record<string, RoleName[]> = {
  'platform:manage': ['ADMIN'],
  'users:manage': ['ADMIN'],
  'artists:approve': ['ADMIN'],
  'artworks:moderate': ['ADMIN'],
  'taxonomy:manage': ['ADMIN'],
  'orders:manage': ['ADMIN'],
  'payments:confirm': ['ADMIN'],
  'commissions:manage': ['ADMIN'],
  'settlements:manage': ['ADMIN'],
  'analytics:view': ['ADMIN'],
  'audit:view': ['ADMIN'],
  'artworks:create': ['ARTIST'],
  'artworks:update:own': ['ARTIST'],
  'collections:manage:own': ['ARTIST', 'ADMIN'],
  'orders:fulfil:own': ['ARTIST'],
  'custom-art:respond': ['ARTIST'],
  'earnings:view:own': ['ARTIST'],
  'cart:use': ['CUSTOMER'],
  'orders:place': ['CUSTOMER'],
  'custom-art:request': ['CUSTOMER'],
  'reviews:write': ['CUSTOMER'],
  'wishlist:use': ['CUSTOMER'],
};

const SETTINGS: Record<string, Prisma.InputJsonValue> = {
  'site.name': 'Art Gallery',
  'site.tagline': 'Art That Tells Your Story',
  'site.contactEmail': 'hello@mymoonsgallery.com',
  'customArt.maxRevisions': 2,
  'shipping.flatFee': 0,
  'digital.downloadLimit': config.DIGITAL_DOWNLOAD_LIMIT,
  'digital.downloadExpiryDays': config.DIGITAL_DOWNLOAD_EXPIRY_DAYS,
  'payments.codEnabled': true,
  'payments.manualInstructions': 'Transfer via UPI/bank and share the reference; our team confirms within 24 hours.',
};

// ───────────────────────────── Image helpers ─────────────────────────────

let imageSeed = 1000;

async function storeSvg(svg: string, area: StorageArea, opts: { thumb?: boolean; quality?: number } = {}) {
  const id = `${Date.now()}-${imageSeed++}`;
  const { data, info } = await sharp(Buffer.from(svg)).webp({ quality: opts.quality ?? 86 }).toBuffer({ resolveWithObject: true });
  const main = await storage.put(area, `${id}.webp`, data, 'image/webp');
  let thumb: { key: string; url: string | null } | null = null;
  if (opts.thumb !== false) {
    const t = await sharp(data).resize({ width: 640, height: 640, fit: 'inside' }).webp({ quality: 78 }).toBuffer();
    thumb = await storage.put(area, `${id}-thumb.webp`, t, 'image/webp');
  }
  return { key: main.key, url: main.url, thumbUrl: thumb?.url ?? main.url, width: info.width, height: info.height, size: data.length, data };
}

const art = (kind: Kind, w: number, h: number, palette: PaletteKey, area: StorageArea = 'artworks', thumb = true) =>
  storeSvg(generate(kind, imageSeed * 7919, w, h, palette), area, { thumb });

// ───────────────────────────── Demo data definitions ─────────────────────────────

interface ArtistSeed {
  fullName: string;
  email: string;
  displayName: string;
  type: 'INDIVIDUAL' | 'STUDIO' | 'GALLERY' | 'CREATIVE_BUSINESS';
  city: string;
  state: string;
  country: string;
  kinds: Kind[];
  palettes: PaletteKey[];
  count: number;
  years: number;
  bio: string;
  statement: string;
  specializations: string[];
  awards: string[];
  customArtBasePrice: number;
  featured?: boolean;
  status?: 'APPROVED' | 'PENDING_APPROVAL';
}

const ARTISTS: ArtistSeed[] = [
  { fullName: 'Meera Iyer', email: 'artist@artgallery.local', displayName: 'Meera Iyer Studio', type: 'INDIVIDUAL', city: 'Bengaluru', state: 'Karnataka', country: 'IN', kinds: ['portrait', 'mandala', 'landscape'], palettes: ['sunset', 'purple', 'teal'], count: 6, years: 12, bio: 'Watercolour portraits and temple-town landscapes rooted in South Indian tradition.', statement: 'I paint the quiet moments of people and places — the warmth of a festival lamp, the stillness of a temple tank at dawn.', specializations: ['Custom portraits', 'Watercolour', 'Traditional Indian Art'], awards: ['Karnataka Lalit Kala Akademi Award 2022', 'Featured at India Art Fair 2024'], customArtBasePrice: 3500, featured: true },
  { fullName: 'Arjun Kapoor', email: 'arjun@artgallery.local', displayName: 'Kapoor Contemporary', type: 'GALLERY', city: 'Mumbai', state: 'Maharashtra', country: 'IN', kinds: ['abstract'], palettes: ['carnival', 'purple', 'crimson'], count: 5, years: 18, bio: 'A Mumbai gallery championing bold abstract expressionism.', statement: 'Colour is a language before it is a picture.', specializations: ['Abstract expressionism', 'Large canvases'], awards: ['Jehangir Art Gallery solo show 2021'], customArtBasePrice: 9000, featured: true },
  { fullName: 'Lena Fischer', email: 'lena@artgallery.local', displayName: 'Lena Fischer', type: 'INDIVIDUAL', city: 'Berlin', state: 'Berlin', country: 'DE', kinds: ['lineart', 'abstract'], palettes: ['pastel', 'earth', 'teal'], count: 5, years: 9, bio: 'Minimalist compositions inspired by architecture and botany.', statement: 'I look for calm — a single arch, a single leaf, enough space to breathe.', specializations: ['Minimalism', 'Line art', 'Scandinavian interiors'], awards: [], customArtBasePrice: 5000, featured: true },
  { fullName: 'Kavya Nair', email: 'kavya@artgallery.local', displayName: 'Kavya Nair Art', type: 'INDIVIDUAL', city: 'Kochi', state: 'Kerala', country: 'IN', kinds: ['portrait'], palettes: ['purple', 'sunset', 'indigo'], count: 5, years: 7, bio: 'Digital and acrylic portraits bursting with colour and emotion.', statement: 'Every face holds a garden of colours — I just let them bloom.', specializations: ['Digital painting', 'Emotional portraits', 'Photo-to-art commissions'], awards: ['Kochi Muziris Biennale — Students’ Biennale 2018'], customArtBasePrice: 2500, featured: true },
  { fullName: 'Rohan Das', email: 'rohan@artgallery.local', displayName: 'Das Ink Works', type: 'STUDIO', city: 'Kolkata', state: 'West Bengal', country: 'IN', kinds: ['sketch'], palettes: ['mono'], count: 5, years: 20, bio: 'Charcoal and ink studies of old Kolkata — lanes, trams and ghats.', statement: 'Charcoal remembers the hand; the city remembers everything else.', specializations: ['Charcoal', 'Urban sketching', 'Pencil portraits'], awards: ['Academy of Fine Arts Kolkata Award 2015'], customArtBasePrice: 2000 },
  { fullName: 'Sofia Marques', email: 'sofia@artgallery.local', displayName: 'Atelier Sofia', type: 'STUDIO', city: 'Lisbon', state: 'Lisbon', country: 'PT', kinds: ['landscape', 'tree'], palettes: ['forest', 'ocean', 'sunset'], count: 5, years: 15, bio: 'Atmospheric oil landscapes of coasts, forests and luminous skies.', statement: 'Light changes everything — I chase it across the horizon.', specializations: ['Oil landscapes', 'Plein air'], awards: ['Lisbon Art Prize finalist 2023'], customArtBasePrice: 7000, featured: true },
  { fullName: 'Vikram Rathore', email: 'vikram@artgallery.local', displayName: 'Rathore Heritage Gallery', type: 'GALLERY', city: 'Jaipur', state: 'Rajasthan', country: 'IN', kinds: ['mandala'], palettes: ['crimson', 'sunset', 'indigo'], count: 5, years: 25, bio: 'Heritage mandalas, Pichwai and folk traditions from Rajasthan.', statement: 'We keep centuries-old geometry alive, one petal at a time.', specializations: ['Mandala', 'Pichwai', 'Folk art'], awards: ['National Award for Master Craftsmen 2019'], customArtBasePrice: 6000 },
  { fullName: 'Aiko Tanaka', email: 'aiko@artgallery.local', displayName: 'Aiko Tanaka', type: 'INDIVIDUAL', city: 'Kyoto', state: 'Kyoto', country: 'JP', kinds: ['portrait', 'pop'], palettes: ['pastel', 'indigo', 'carnival'], count: 4, years: 6, bio: 'Anime-inspired portraits and playful pop illustrations.', statement: 'Joy is a valid artistic statement.', specializations: ['Anime portraits', 'Character art'], awards: [], customArtBasePrice: 3000 },
  { fullName: 'Nikhil Verma', email: 'nikhil@artgallery.local', displayName: 'Pixel & Pigment', type: 'CREATIVE_BUSINESS', city: 'Pune', state: 'Maharashtra', country: 'IN', kinds: ['pop', 'abstract'], palettes: ['carnival', 'sunset'], count: 4, years: 8, bio: 'A creative studio mixing pop culture, Bollywood and street art.', statement: 'Art should be loud enough to start a conversation.', specializations: ['Pop art', 'Digital prints'], awards: [], customArtBasePrice: 2800 },
  { fullName: 'Ananya Sen', email: 'ananya@artgallery.local', displayName: 'Ananya Sen Fine Art', type: 'INDIVIDUAL', city: 'New Delhi', state: 'Delhi', country: 'IN', kinds: ['abstract', 'tree'], palettes: ['purple', 'teal', 'carnival'], count: 4, years: 11, bio: 'Contemporary acrylics exploring memory, roots and belonging.', statement: 'The tree is my self-portrait: rooted, reaching, changing with seasons.', specializations: ['Contemporary acrylics', 'Large wall art'], awards: ['India Habitat Centre Emerging Artist 2020'], customArtBasePrice: 8000 },
  { fullName: 'Rahul Mehta', email: 'rahul.mehta@artgallery.local', displayName: 'Mehta Murals', type: 'STUDIO', city: 'Ahmedabad', state: 'Gujarat', country: 'IN', kinds: ['abstract'], palettes: ['sunset'], count: 0, years: 4, bio: 'Mural studio awaiting approval.', statement: 'Walls are canvases for communities.', specializations: ['Murals'], awards: [], customArtBasePrice: 15000, status: 'PENDING_APPROVAL' },
];

const TITLES: Record<Kind, string[]> = {
  abstract: ['Echoes of Monsoon', 'Violet Reverie', 'Kinetic Bloom', 'Saffron Pulse', 'Chromatic Drift', 'Midnight Carnival', 'Ember Song', 'Fluid Memory', 'Neon Ragas', 'Velvet Storm', 'Holi Afterglow', 'Quiet Thunder'],
  landscape: ['Misty Nilgiris', 'Lakeside Dawn', 'Desert Lanterns', 'Pine Silence', 'Harvest Moon Valley', 'Coastal Evening', 'Atlantic Hush', 'Himalayan Blush', 'Sintra Twilight', 'Backwater Glow'],
  mandala: ['Lotus Mandala', 'Sun Wheel', 'Rangoli Bloom', 'Temple Geometry', 'Cosmic Chakra', 'Marigold Mandala', 'Pichwai Lotus', 'Diya Constellation', 'Peacock Rosette', 'Sacred Bloom'],
  lineart: ['Arches of Calm', 'Quiet Contours', 'Terracotta Morning', 'Sage & Sun', 'Botanical Hush', 'Desert Doorway', 'Soft Horizon', 'Muted Garden', 'Still Arches', 'Paper Moon'],
  sketch: ['Old Kolkata Lanes', 'Charcoal Study I', 'Ghats at Dusk', 'Monsoon Tram', 'College Street', 'Howrah Shadows', 'North Calcutta Arches', 'Kumartuli Light', 'Rainy Rooftops', 'Graphite City'],
  portrait: ['Her Inner Garden', 'The Dreamer', 'Colours Within', 'Silent Strength', 'Spectrum Soul', 'Bloom Within', 'Festival Eyes', 'Sakura Daydream', 'Midnight Muse', 'Golden Hour Grace', 'Kathakali Spirit', 'Wanderer'],
  pop: ['Chai Pop', 'Retro Rickshaw', 'Bollywood Neon', 'Comic Crush', 'Dot Matrix Love', 'Masala Pop', 'Tiffin Stars', 'Kawaii Carnival', 'Boom Box Bazaar', 'Electric Mango'],
  tree: ['Tree of Life', 'Roots & Wings', 'Celestial Banyan', 'Gulmohar Dreams', 'Spirit Tree', 'Blossoming Self', 'Firefly Grove', 'Sacred Peepal'],
};

const KIND_META: Record<Kind, { category: string; styles: string[]; mediums: string[]; themes: string[]; type: ArtworkType }> = {
  abstract: { category: 'abstract-art', styles: ['abstract', 'contemporary', 'modern'], mediums: ['acrylic', 'mixed-media', 'oil'], themes: ['urban', 'festival'], type: 'ABSTRACT' },
  landscape: { category: 'landscape-art', styles: ['oil-painting', 'realistic', 'watercolor'], mediums: ['oil', 'watercolor', 'acrylic'], themes: ['nature', 'wildlife'], type: 'ORIGINAL_PAINTING' },
  mandala: { category: 'traditional-art', styles: ['mandala', 'traditional-indian-art', 'folk-art'], mediums: ['ink', 'acrylic', 'pastel'], themes: ['spiritual', 'heritage'], type: 'WALL_ART' },
  lineart: { category: 'minimalist-art', styles: ['minimalist', 'line-art', 'vintage'], mediums: ['ink', 'paper', 'acrylic'], themes: ['nature', 'love-family'], type: 'ILLUSTRATION' },
  sketch: { category: 'illustrations', styles: ['charcoal', 'pencil-sketch'], mediums: ['charcoal', 'pencil'], themes: ['heritage', 'urban', 'monochrome'], type: 'ILLUSTRATION' },
  portrait: { category: 'portraits', styles: ['digital-painting', 'watercolor', 'contemporary', 'anime'], mediums: ['watercolor', 'acrylic', 'oil'], themes: ['love-family', 'heritage'], type: 'PORTRAIT' },
  pop: { category: 'modern-art', styles: ['pop-art', 'cartoon'], mediums: ['acrylic', 'digital'], themes: ['urban', 'festival'], type: 'WALL_ART' },
  tree: { category: 'wall-art', styles: ['contemporary', 'abstract'], mediums: ['acrylic', 'oil'], themes: ['nature', 'spiritual'], type: 'ORIGINAL_PAINTING' },
};

const ORIENTATION_SIZES: Array<{ orientation: Orientation; w: number; h: number; cm: [number, number] }> = [
  { orientation: 'PORTRAIT', w: 1200, h: 1500, cm: [60, 75] },
  { orientation: 'LANDSCAPE', w: 1600, h: 1100, cm: [90, 62] },
  { orientation: 'SQUARE', w: 1300, h: 1300, cm: [50, 50] },
  { orientation: 'PORTRAIT', w: 1100, h: 1500, cm: [30, 41] },
  { orientation: 'LANDSCAPE', w: 1500, h: 1000, cm: [120, 80] },
];

const CUSTOMERS = [
  { fullName: 'Priya Sharma', email: 'customer@artgallery.local', phone: '9811122233', city: 'Bengaluru', state: 'Karnataka' },
  { fullName: 'Rahul Gupta', email: 'rahul.gupta@artgallery.local', phone: '9822233344', city: 'Mumbai', state: 'Maharashtra' },
  { fullName: 'Sneha Patel', email: 'sneha@artgallery.local', phone: '9833344455', city: 'Ahmedabad', state: 'Gujarat' },
  { fullName: 'David Thomas', email: 'david@artgallery.local', phone: '9844455566', city: 'Chennai', state: 'Tamil Nadu' },
  { fullName: 'Fatima Khan', email: 'fatima@artgallery.local', phone: '9855566677', city: 'Hyderabad', state: 'Telangana' },
  { fullName: 'Karan Malhotra', email: 'karan@artgallery.local', phone: '9866677788', city: 'New Delhi', state: 'Delhi' },
];

const REVIEW_TEXTS = [
  ['Even more beautiful in person', 'The colours glow in morning light. Packaging was museum-grade and it arrived perfectly.'],
  ['Our living room has a soul now', 'Guests ask about it every time. The artist even sent a handwritten note!'],
  ['Stunning detail', 'You can see every brushstroke. Worth every rupee.'],
  ['Perfect anniversary gift', 'My wife teared up. Thank you for making this so special.'],
  ['Exactly as described', 'Accurate colours and dimensions, quick shipping and great communication.'],
  ['Calming and elegant', 'It fits beautifully above our bed — peaceful every single day.'],
  ['A conversation starter', 'Bold, joyful and full of energy. Love it.'],
  ['Gallery quality', 'The print quality is superb and the paper feels luxurious.'],
];

// ───────────────────────────── Seed steps ─────────────────────────────

async function seedReference() {
  for (const name of ['ADMIN', 'ARTIST', 'CUSTOMER'] as RoleName[]) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name, description: `${name.toLowerCase()} role` } });
  }
  const roles = await prisma.role.findMany();
  for (const [key, roleNames] of Object.entries(PERMISSIONS)) {
    const perm = await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
    for (const rn of roleNames) {
      const role = roles.find((r) => r.name === rn)!;
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } }, update: {}, create: { roleId: role.id, permissionId: perm.id } });
    }
  }

  for (const [i, name] of MEDIUMS.entries()) {
    await prisma.artworkMedium.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name), sortOrder: i } });
  }
  for (const [i, name] of THEMES.entries()) {
    await prisma.artworkTheme.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name), sortOrder: i } });
  }
  for (const [i, [name, description, kind, palette]] of CATEGORIES.entries()) {
    const slug = slugify(name);
    const existing = await prisma.artworkCategory.findUnique({ where: { slug } });
    if (existing?.imageUrl) continue;
    const img = await art(kind, 900, 700, palette, 'site', false);
    await prisma.artworkCategory.upsert({ where: { slug }, update: { imageUrl: img.url }, create: { name, slug, description, imageUrl: img.url, sortOrder: i } });
  }
  for (const [i, [name, description, kind, palette]] of STYLES.entries()) {
    const slug = slugify(name);
    const existing = await prisma.artworkStyle.findUnique({ where: { slug } });
    if (existing?.imageUrl) continue;
    const img = await art(kind, 600, 750, palette, 'site', false);
    await prisma.artworkStyle.upsert({ where: { slug }, update: { imageUrl: img.url }, create: { name, slug, description, imageUrl: img.url, sortOrder: i, availableForCustomArt: true } });
  }

  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.systemSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  if (!(await prisma.commissionRule.findFirst({ where: { scope: 'GLOBAL' } }))) {
    await prisma.commissionRule.create({ data: { scope: 'GLOBAL', percentage: config.COMMISSION_DEFAULT_PERCENTAGE } });
  }
  if (!(await prisma.commissionRule.findFirst({ where: { scope: 'CUSTOM_ART' } }))) {
    await prisma.commissionRule.create({ data: { scope: 'CUSTOM_ART', percentage: 15 } });
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@artgallery.local').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';
  if (/CHANGE_ME/.test(adminPassword)) throw new Error('Set SEED_ADMIN_PASSWORD before seeding');
  const adminRole = roles.find((r) => r.name === 'ADMIN')!;
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, fullName: 'Platform Admin', passwordHash: await bcrypt.hash(adminPassword, 12), roles: { create: { roleId: adminRole.id } } },
  });
  return { admin, adminEmail, adminPassword, roles };
}

async function seedDemo(adminId: string) {
  const roles = await prisma.role.findMany();
  const roleId = (n: RoleName) => roles.find((r) => r.name === n)!.id;
  const [categories, styles, mediums, themes] = await Promise.all([
    prisma.artworkCategory.findMany(),
    prisma.artworkStyle.findMany(),
    prisma.artworkMedium.findMany(),
    prisma.artworkTheme.findMany(),
  ]);
  const bySlug = <T extends { slug: string }>(rows: T[], slug: string) => {
    const row = rows.find((r) => r.slug === slug);
    if (!row) throw new Error(`Missing seed taxonomy ${slug}`);
    return row;
  };
  const rng = mulberry32(20261003);
  const pick = <T>(arr: readonly T[]) => arr[Math.floor(rng() * arr.length)];
  const between = (a: number, b: number) => Math.floor(a + rng() * (b - a + 1));
  const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000 - between(0, 20) * 3_600_000);

  const artistHash = await bcrypt.hash('Artist@12345', 10);
  const customerHash = await bcrypt.hash('Customer@12345', 10);

  // Customers
  console.log('  • customers');
  const customers: Prisma.UserGetPayload<{ include: { addresses: true; wishlists: true } }>[] = [];
  for (const c of CUSTOMERS) {
    const u = await prisma.user.create({
      data: {
        email: c.email,
        fullName: c.fullName,
        phone: c.phone,
        passwordHash: customerHash,
        createdAt: daysAgo(between(40, 200)),
        roles: { create: { roleId: roleId('CUSTOMER') } },
        customerProfile: { create: {} },
        wishlists: { create: { name: 'My Wishlist' } },
        addresses: { create: { label: 'Home', fullName: c.fullName, phone: c.phone, line1: `${between(2, 220)} ${pick(['MG Road', 'Park Street', 'Lake View Lane', 'Temple Road', 'Hill Crest Avenue'])}`, city: c.city, state: c.state, postalCode: String(between(110001, 600099)), isDefault: true } },
      },
      include: { addresses: true, wishlists: true },
    });
    customers.push(u);
  }

  // Artists, galleries, artworks
  type SeededArtwork = Awaited<ReturnType<typeof prisma.artwork.create>> & { kind: Kind; imageUrl: string };
  const artworks: SeededArtwork[] = [];
  const artistRows: Array<Prisma.ArtistGetPayload<{ include: { gallery: true } }> & { seed: ArtistSeed }> = [];
  const titleIndex: Record<string, number> = {};
  let skuCounter = 1;

  for (const [ai, a] of ARTISTS.entries()) {
    console.log(`  • artist ${a.displayName}`);
    const palette = a.palettes[0];
    const av = await storeSvg(avatar(5000 + ai * 31, a.palettes[1] ?? palette, 600), 'artists');
    const cover = await art(a.kinds[0], 1800, 700, palette, 'galleries', false);
    const primaryCategory = bySlug(categories, KIND_META[a.kinds[0]].category);
    const artistStyles = [...new Set(a.kinds.flatMap((k) => KIND_META[k].styles))].map((s) => ({ id: bySlug(styles, s).id }));
    const artistMediums = [...new Set(a.kinds.flatMap((k) => KIND_META[k].mediums))].map((m) => ({ id: bySlug(mediums, m).id }));
    const status = a.status ?? 'APPROVED';
    const user = await prisma.user.create({
      data: {
        email: a.email,
        fullName: a.fullName,
        phone: `98${between(10000000, 99999999)}`,
        passwordHash: artistHash,
        avatarUrl: av.url,
        createdAt: daysAgo(between(120, 400)),
        roles: { create: [{ roleId: roleId('ARTIST') }, { roleId: roleId('CUSTOMER') }] },
        customerProfile: { create: {} },
        wishlists: { create: { name: 'My Wishlist' } },
        artist: {
          create: {
            displayName: a.displayName,
            slug: slugify(a.displayName),
            type: a.type,
            status,
            avatarUrl: av.url,
            coverImageUrl: cover.url,
            isFeatured: !!a.featured,
            acceptsCustomArt: status === 'APPROVED',
            customArtBasePrice: a.customArtBasePrice,
            styles: { connect: artistStyles },
            mediums: { connect: artistMediums },
            profile: {
              create: {
                bio: a.bio,
                description: `${a.bio} Based in ${a.city}, ${a.displayName} has been creating for ${a.years} years, with work collected across India and abroad.`,
                artistStatement: a.statement,
                yearsOfExperience: a.years,
                website: `https://${slugify(a.displayName)}.art`,
                socialLinks: { instagram: `https://instagram.com/${slugify(a.displayName).replace(/-/g, '')}` },
                specializations: a.specializations,
                awards: a.awards,
                primaryCategoryId: primaryCategory.id,
              },
            },
            address: { create: { city: a.city, state: a.state, country: a.country } },
            approvals: {
              create: [
                { toStatus: 'PENDING_APPROVAL', reason: 'Registered' },
                ...(status === 'APPROVED' ? [{ fromStatus: 'PENDING_APPROVAL' as const, toStatus: 'APPROVED' as const, adminId, reason: 'Portfolio verified' }] : []),
              ],
            },
            gallery: { create: { name: a.displayName, slug: `${slugify(a.displayName)}-gallery`, tagline: a.bio, description: a.statement, coverImageUrl: cover.url, isFeatured: !!a.featured } },
          },
        },
      },
      include: { artist: { include: { gallery: true } } },
    });
    const artist = user.artist!;
    artistRows.push({ ...artist, seed: a });
    if (a.featured) await prisma.featuredArtist.create({ data: { artistId: artist.id, sortOrder: ai } });

    for (let i = 0; i < a.count; i++) {
      const kind = a.kinds[i % a.kinds.length];
      const meta = KIND_META[kind];
      const pal: PaletteKey = kind === 'sketch' ? 'mono' : a.palettes[i % a.palettes.length];
      const size = ORIENTATION_SIZES[(ai + i) % ORIENTATION_SIZES.length];
      const format: ArtworkFormat = i % 6 === 3 ? 'PRINT' : i % 6 === 4 ? 'DIGITAL' : 'ORIGINAL';
      const type: ArtworkType = format === 'PRINT' ? 'PRINT' : format === 'DIGITAL' && kind !== 'portrait' ? 'DIGITAL_ART' : meta.type;
      titleIndex[kind] = (titleIndex[kind] ?? 0) + 1;
      const title = TITLES[kind][(titleIndex[kind] - 1) % TITLES[kind].length] + (titleIndex[kind] > TITLES[kind].length ? ` II` : '');
      const img = await art(kind, size.w, size.h, pal);
      let digitalFileKey: string | null = null;
      if (format === 'DIGITAL') {
        const png = await sharp(img.data).png().toBuffer();
        digitalFileKey = (await storage.put('digitalArt', `${Date.now()}-${skuCounter}.png`, png, 'image/png')).key;
      }
      const basePrice = format === 'ORIGINAL' ? between(8, 150) * 1000 : format === 'PRINT' ? between(15, 60) * 100 : between(8, 40) * 100;
      const discounted = i % 5 === 2 ? Math.round(basePrice * 0.85) : null;
      const categorySlug = format === 'DIGITAL' ? 'digital-art' : i % 4 === 3 && a.kinds.length === 1 ? pick(['contemporary-art', 'wall-art', 'cultural-art', 'paintings']) : meta.category;
      const styleSlug = kind === 'portrait' && a.displayName === 'Aiko Tanaka' ? 'anime' : meta.styles[i % meta.styles.length];
      const mediumSlug = format === 'DIGITAL' ? 'digital' : meta.mediums[i % meta.mediums.length];
      const createdAt = daysAgo(between(3, 160));
      const extraImages = [];
      if (i % 2 === 0) {
        // Detail crop as an additional gallery image
        const meta2 = await sharp(img.data).metadata();
        const cw = Math.round((meta2.width ?? size.w) * 0.5);
        const ch = Math.round((meta2.height ?? size.h) * 0.5);
        const crop = await sharp(img.data).extract({ left: Math.round(cw * 0.4), top: Math.round(ch * 0.4), width: cw, height: ch }).resize(1200).webp({ quality: 84 }).toBuffer();
        const stored = await storage.put('artworks', `${Date.now()}-${skuCounter}-detail.webp`, crop, 'image/webp');
        extraImages.push({ url: stored.url!, thumbUrl: stored.url!, storageKey: stored.key, width: 1200, height: Math.round((1200 * ch) / cw), isPrimary: false, sortOrder: 1, altText: `${title} — detail` });
      }
      const quantity = format === 'ORIGINAL' ? 1 : format === 'PRINT' ? between(10, 40) : 0;
      const tags = [kind, pal === 'mono' ? 'black-and-white' : PALETTES[pal].name, meta.themes[0], format.toLowerCase()];
      const artwork = await prisma.artwork.create({
        data: {
          artistId: artist.id,
          title,
          slug: uniqueSlug(title),
          description: `${title} is ${format === 'DIGITAL' ? 'a high-resolution digital artwork' : format === 'PRINT' ? 'a limited-edition archival print' : 'an original, signed artwork'} by ${a.displayName}. ${a.statement} ${format === 'ORIGINAL' ? 'Ships ready to hang with a certificate of authenticity.' : ''}`.trim(),
          type,
          format,
          status: 'APPROVED',
          categoryId: bySlug(categories, categorySlug).id,
          styleId: bySlug(styles, styleSlug).id,
          mediumId: bySlug(mediums, mediumSlug).id,
          themeId: bySlug(themes, slugify(meta.themes[i % meta.themes.length])).id,
          yearCreated: 2026 - between(0, 4),
          widthCm: format === 'DIGITAL' ? null : size.cm[0],
          heightCm: format === 'DIGITAL' ? null : size.cm[1],
          depthCm: format === 'ORIGINAL' ? 3 : null,
          orientation: size.orientation,
          dominantColor: PALETTES[pal].name,
          price: basePrice,
          discountPrice: discounted,
          currency: config.DEFAULT_CURRENCY,
          sku: `AG-${String(skuCounter++).padStart(5, '0')}`,
          isFeatured: i === 0 || (i === 2 && ai % 2 === 0),
          isCustomizable: kind === 'portrait' || (kind === 'mandala' && i % 2 === 0),
          licenseInfo: format === 'DIGITAL' ? 'Personal use licence. Commercial use requires written permission from the artist.' : null,
          copyrightInfo: `© ${new Date().getFullYear()} ${a.displayName}. All rights reserved.`,
          thumbnailUrl: img.thumbUrl,
          previewUrl: img.url,
          digitalFileKey,
          viewCount: between(40, 1400),
          publishedAt: createdAt,
          createdAt,
          images: { create: [{ url: img.url!, thumbUrl: img.thumbUrl, storageKey: img.key, width: img.width, height: img.height, isPrimary: true, sortOrder: 0, altText: title }, ...extraImages] },
          inventory: { create: { quantity } },
          approvals: { create: [{ toStatus: 'PENDING_REVIEW', reason: 'Submitted' }, { fromStatus: 'PENDING_REVIEW', toStatus: 'APPROVED', actorId: adminId }] },
          tags: {
            create: tags.map((t) => ({
              tag: { connectOrCreate: { where: { slug: slugify(t) }, create: { name: t.replace(/-/g, ' '), slug: slugify(t) } } },
            })),
          },
        },
      });
      artworks.push({ ...artwork, kind, imageUrl: img.thumbUrl! });
      if (artwork.isFeatured) await prisma.featuredArtwork.create({ data: { artworkId: artwork.id, sortOrder: artworks.length } });
    }
  }
  // One artwork waiting for moderation so the admin queue is not empty.
  const meera = artistRows[0];
  {
    const img = await art('mandala', 1300, 1300, 'purple');
    await prisma.artwork.create({
      data: {
        artistId: meera.id,
        title: 'Navaratri Mandala',
        slug: uniqueSlug('Navaratri Mandala'),
        description: 'A nine-ring mandala celebrating the nine nights of Navaratri.',
        type: 'WALL_ART',
        format: 'ORIGINAL',
        status: 'PENDING_REVIEW',
        categoryId: bySlug(categories, 'religious-art').id,
        styleId: bySlug(styles, 'mandala').id,
        mediumId: bySlug(mediums, 'acrylic').id,
        price: 18000,
        sku: `AG-${String(skuCounter).padStart(5, '0')}`,
        orientation: 'SQUARE',
        dominantColor: 'purple',
        thumbnailUrl: img.thumbUrl,
        images: { create: { url: img.url!, thumbUrl: img.thumbUrl, storageKey: img.key, width: img.width, height: img.height, isPrimary: true } },
        inventory: { create: { quantity: 1 } },
        approvals: { create: { toStatus: 'PENDING_REVIEW', reason: 'Submitted' } },
      },
    });
  }

  // Collections
  console.log('  • collections');
  const byKind = (...kinds: Kind[]) => artworks.filter((w) => kinds.includes(w.kind));
  const artistByName = (n: string) => artistRows.find((r) => r.seed.displayName === n)!;
  const collectionDefs: Array<{ name: string; description: string; artistName?: string; items: SeededArtwork[]; featured: boolean }> = [
    { name: 'Nature Collection', description: 'Forests, coasts and skies — art that brings the outdoors in.', items: byKind('landscape', 'tree'), featured: true },
    { name: 'Indian Heritage', description: 'Mandalas, temple towns and old-city sketches celebrating India’s living traditions.', items: [...byKind('mandala'), ...byKind('sketch').slice(0, 3)], featured: true },
    { name: 'Modern Abstract', description: 'Bold colour-field and gestural abstraction from Kapoor Contemporary.', artistName: 'Kapoor Contemporary', items: artworks.filter((w) => w.artistId === artistByName('Kapoor Contemporary').id), featured: true },
    { name: 'Black & White', description: 'Monochrome studies in charcoal, graphite and ink.', items: byKind('sketch'), featured: false },
    { name: 'Emotional Portraits', description: 'Faces full of colour, feeling and story.', artistName: 'Kavya Nair Art', items: artworks.filter((w) => w.artistId === artistByName('Kavya Nair Art').id), featured: true },
    { name: 'Minimalist Collection', description: 'Calm arches, soft palettes and generous negative space.', artistName: 'Lena Fischer', items: artworks.filter((w) => w.artistId === artistByName('Lena Fischer').id), featured: false },
  ];
  const collections = [];
  for (const def of collectionDefs) {
    const owner = def.artistName ? artistByName(def.artistName) : null;
    const c = await prisma.artworkCollection.create({
      data: {
        name: def.name,
        slug: slugify(def.name),
        description: def.description,
        artistId: owner?.id ?? null,
        coverImageUrl: def.items[0]?.imageUrl ?? null,
        isFeatured: def.featured,
        items: { create: def.items.map((w, i) => ({ artworkId: w.id, sortOrder: i })) },
      },
    });
    if (owner?.gallery) await prisma.galleryCollection.create({ data: { galleryId: owner.gallery.id, collectionId: c.id } });
    collections.push(c);
  }

  // Follows
  console.log('  • follows, wishlists, views');
  const approvedArtists = artistRows.filter((r) => r.seed.status !== 'PENDING_APPROVAL');
  for (const [ci, c] of customers.entries()) {
    const followed = approvedArtists.filter((_, i) => (i + ci) % 3 === 0 || i === 0);
    for (const a of followed) await prisma.artistFollow.create({ data: { userId: c.id, artistId: a.id, createdAt: daysAgo(between(1, 60)) } });
  }
  for (const a of approvedArtists) {
    const count = await prisma.artistFollow.count({ where: { artistId: a.id } });
    await prisma.artist.update({ where: { id: a.id }, data: { followerCount: count + between(20, 400) } });
  }

  // Wishlist + recently viewed for the demo customer
  const demo = customers[0];
  const wishlistId = demo.wishlists[0].id;
  const wishArtworks = artworks.filter((_, i) => i % 9 === 1).slice(0, 5);
  for (const w of wishArtworks) {
    await prisma.wishlistItem.create({ data: { wishlistId, itemType: 'ARTWORK', targetId: w.id, artworkId: w.id } });
  }
  for (const a of approvedArtists.slice(1, 3)) await prisma.wishlistItem.create({ data: { wishlistId, itemType: 'ARTIST', targetId: a.id, artistId: a.id } });
  await prisma.wishlistItem.create({ data: { wishlistId, itemType: 'COLLECTION', targetId: collections[0].id, collectionId: collections[0].id } });
  for (const w of artworks) {
    const n = await prisma.wishlistItem.count({ where: { itemType: 'ARTWORK', targetId: w.id } });
    if (n || rng() < 0.6) await prisma.artwork.update({ where: { id: w.id }, data: { wishlistCount: n + between(0, 60) } });
  }
  for (const [i, w] of artworks.filter((_, i) => i % 7 === 2).slice(0, 6).entries()) {
    await prisma.recentlyViewedArtwork.create({ data: { userId: demo.id, artworkId: w.id, viewedAt: new Date(Date.now() - i * 3_600_000) } });
  }

  // Orders
  console.log('  • orders, payments, ledger');
  const rules = await loadCommissionRules();
  type Line = { artwork: SeededArtwork; qty: number };
  const createOrder = async (opts: { customer: (typeof customers)[number]; lines: Line[]; method: 'COD' | 'MANUAL'; paid: boolean; delivered: boolean; placedAt: Date; completed?: boolean }) => {
    const orderNumber = referenceCode('AG');
    const subtotalMinor = opts.lines.reduce((s, l) => s + Math.round(Number(l.artwork.discountPrice ?? l.artwork.price) * 100) * l.qty, 0);
    const physical = opts.lines.some((l) => l.artwork.format !== 'DIGITAL');
    const addr = opts.customer.addresses[0];
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: opts.customer.id,
        status: opts.completed ? 'COMPLETED' : opts.delivered ? 'FULFILLED' : opts.paid ? 'CONFIRMED' : 'PENDING',
        paymentStatus: opts.paid ? 'PAID' : opts.method === 'COD' ? 'PENDING' : 'AWAITING_CONFIRMATION',
        paymentMethod: opts.method,
        subtotal: fromMinor(subtotalMinor),
        total: fromMinor(subtotalMinor),
        shippingAddress: physical ? { fullName: addr.fullName, phone: addr.phone, line1: addr.line1, city: addr.city, state: addr.state, postalCode: addr.postalCode, country: addr.country } : undefined,
        placedAt: opts.placedAt,
      },
    });
    const items = [];
    for (const l of opts.lines) {
      const w = l.artwork;
      const unit = Number(w.discountPrice ?? w.price).toFixed(2);
      const resolved = resolveCommission(rules, { kind: 'ARTWORK', artistId: w.artistId, artworkId: w.id, categoryId: w.categoryId });
      const split = computeLine(unit, l.qty, resolved.percentage);
      const digital = w.format === 'DIGITAL';
      const item = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          artistId: w.artistId,
          artworkId: w.id,
          titleSnapshot: w.title,
          imageSnapshot: w.imageUrl,
          format: w.format,
          fulfillmentType: digital ? 'DIGITAL' : 'PHYSICAL',
          fulfillmentStatus: digital ? (opts.paid ? 'DIGITAL_AVAILABLE' : 'PENDING') : opts.delivered ? 'DELIVERED' : 'PENDING',
          unitPrice: unit,
          quantity: l.qty,
          lineTotal: fromMinor(split.grossMinor),
          commissionRate: resolved.percentage,
          commissionAmount: fromMinor(split.commissionMinor),
          artistAmount: fromMinor(split.artistMinor),
          createdAt: opts.placedAt,
        },
      });
      await prisma.commission.create({ data: { orderItemId: item.id, ruleScope: resolved.scope, ruleId: resolved.ruleId, percentage: resolved.percentage, grossAmount: fromMinor(split.grossMinor), amount: fromMinor(split.commissionMinor), artistAmount: fromMinor(split.artistMinor), createdAt: opts.placedAt } });
      const ledgerStatus = opts.paid ? 'AVAILABLE' : 'PENDING';
      await prisma.artistLedger.createMany({
        data: [
          { artistId: w.artistId, type: 'SALE_CREDIT', status: ledgerStatus, amount: fromMinor(split.grossMinor), description: `Sale: ${w.title} (${orderNumber})`, orderItemId: item.id, createdAt: opts.placedAt },
          { artistId: w.artistId, type: 'COMMISSION_DEBIT', status: ledgerStatus, amount: fromMinor(-split.commissionMinor), description: `Platform commission ${resolved.percentage}% (${orderNumber})`, orderItemId: item.id, createdAt: opts.placedAt },
        ],
      });
      if (w.format !== 'DIGITAL') {
        const inv = await prisma.artworkInventory.update({ where: { artworkId: w.id }, data: { quantity: { decrement: l.qty } } });
        if (inv.quantity <= 0) await prisma.artwork.update({ where: { id: w.id }, data: { status: 'SOLD_OUT' } });
      }
      await prisma.artwork.update({ where: { id: w.id }, data: { salesCount: { increment: l.qty } } });
      if (digital && opts.paid && w.digitalFileKey) {
        await prisma.downloadAccess.create({ data: { orderItemId: item.id, userId: opts.customer.id, artworkId: w.id, storageKey: w.digitalFileKey, maxDownloads: config.DIGITAL_DOWNLOAD_LIMIT, expiresAt: new Date(Date.now() + config.DIGITAL_DOWNLOAD_EXPIRY_DAYS * 86_400_000) } });
      }
      items.push(item);
    }
    for (const artistId of [...new Set(opts.lines.filter((l) => l.artwork.format !== 'DIGITAL').map((l) => l.artwork.artistId))]) {
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          artistId,
          carrier: opts.delivered ? pick(['BlueDart', 'Delhivery', 'DTDC']) : null,
          trackingNumber: opts.delivered ? `TRK${between(10000000, 99999999)}` : null,
          status: opts.delivered ? 'DELIVERED' : 'PENDING',
          shippedAt: opts.delivered ? new Date(opts.placedAt.getTime() + 2 * 86_400_000) : null,
          deliveredAt: opts.delivered ? new Date(opts.placedAt.getTime() + 5 * 86_400_000) : null,
          packagingInfo: opts.delivered ? 'Bubble wrap, corner protectors, rigid art box' : null,
        },
      });
    }
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: opts.method === 'COD' ? 'cod' : 'manual',
        method: opts.method,
        status: opts.paid ? 'PAID' : opts.method === 'COD' ? 'PENDING' : 'AWAITING_CONFIRMATION',
        amount: fromMinor(subtotalMinor),
        providerRef: opts.paid ? `UTR${between(100000, 999999)}` : null,
        confirmedById: opts.paid ? adminId : null,
        confirmedAt: opts.paid ? new Date(opts.placedAt.getTime() + 86_400_000) : null,
        meta: { instructions: opts.method === 'COD' ? 'Pay in cash when your artwork is delivered.' : 'Bank transfer / UPI — confirmed manually.' },
        createdAt: opts.placedAt,
      },
    });
    return { order, items };
  };

  const available = (fmt: ArtworkFormat) => artworks.filter((w) => w.format === fmt);
  const prints = available('PRINT');
  const digitals = available('DIGITAL');
  const originals = available('ORIGINAL').filter((w) => w.artistId !== meera.id);
  const deliveredItems: Array<{ customer: (typeof customers)[number]; artwork: SeededArtwork; orderItemId: string }> = [];

  // Historical orders spread over the last ~80 days (analytics charts)
  for (let i = 0; i < 16; i++) {
    const customer = customers[1 + (i % (customers.length - 1))];
    const lines: Line[] = [{ artwork: pick([...prints, ...digitals]), qty: 1 }];
    if (i % 4 === 0 && originals.length) lines.push({ artwork: originals.splice(between(0, originals.length - 1), 1)[0], qty: 1 });
    if (i % 3 === 0) lines.push({ artwork: pick(digitals), qty: 1 });
    const unique = lines.filter((l, idx) => lines.findIndex((x) => x.artwork.id === l.artwork.id) === idx);
    const paid = i % 7 !== 6;
    const { items } = await createOrder({ customer, lines: unique, method: unique.some((l) => l.artwork.format === 'DIGITAL') ? 'MANUAL' : pick(['COD', 'MANUAL']), paid, delivered: paid, completed: paid && i % 2 === 0, placedAt: daysAgo(between(2, 80)) });
    if (paid) items.forEach((it, idx) => deliveredItems.push({ customer, artwork: unique[idx].artwork, orderItemId: it.id }));
  }
  // Demo customer orders: one completed (original + print), one COD pending for Meera to fulfil, one digital download.
  const meeraArt = artworks.filter((w) => w.artistId === meera.id);
  const meeraOriginal = meeraArt.find((w) => w.format === 'ORIGINAL' && !w.isFeatured)!;
  const meeraPrint = meeraArt.find((w) => w.format === 'PRINT')!;
  const meeraDigital = meeraArt.find((w) => w.format === 'DIGITAL')!;
  const completed = await createOrder({ customer: demo, lines: [{ artwork: meeraOriginal, qty: 1 }, { artwork: prints[1] ?? meeraPrint, qty: 1 }], method: 'MANUAL', paid: true, delivered: true, completed: true, placedAt: daysAgo(21) });
  completed.items.forEach((it, idx) => deliveredItems.push({ customer: demo, artwork: idx === 0 ? meeraOriginal : (prints[1] ?? meeraPrint), orderItemId: it.id }));
  await createOrder({ customer: demo, lines: [{ artwork: meeraPrint, qty: 2 }], method: 'COD', paid: false, delivered: false, placedAt: daysAgo(1) });
  await createOrder({ customer: demo, lines: [{ artwork: meeraDigital, qty: 1 }], method: 'MANUAL', paid: true, delivered: false, placedAt: daysAgo(6) });
  await createOrder({ customer: customers[2], lines: [{ artwork: meeraPrint, qty: 1 }], method: 'MANUAL', paid: false, delivered: false, placedAt: daysAgo(0) });

  // Reviews (verified purchases)
  console.log('  • reviews');
  const reviewed = new Set<string>();
  for (const [i, d] of deliveredItems.entries()) {
    const key = `${d.artwork.id}:${d.customer.id}`;
    if (reviewed.has(key) || i % 4 === 3) continue;
    reviewed.add(key);
    const [title, body] = REVIEW_TEXTS[i % REVIEW_TEXTS.length];
    await prisma.artworkReview.create({ data: { artworkId: d.artwork.id, userId: d.customer.id, orderItemId: d.orderItemId, rating: i % 6 === 5 ? 4 : 5, title, body, verifiedPurchase: true, createdAt: daysAgo(between(0, 15)) } });
    const artistKey = `artist:${d.artwork.artistId}:${d.customer.id}`;
    if (!reviewed.has(artistKey)) {
      reviewed.add(artistKey);
      await prisma.artistReview.create({ data: { artistId: d.artwork.artistId, userId: d.customer.id, rating: i % 5 === 4 ? 4 : 5, body: 'Wonderful to work with — thoughtful, responsive and incredibly talented.', verifiedPurchase: true } });
    }
  }
  for (const w of artworks) {
    const agg = await prisma.artworkReview.aggregate({ where: { artworkId: w.id, status: 'APPROVED' }, _avg: { rating: true }, _count: true });
    if (agg._count) await prisma.artwork.update({ where: { id: w.id }, data: { ratingAverage: agg._avg.rating ?? 0, ratingCount: agg._count } });
  }
  for (const a of artistRows) {
    const agg = await prisma.artistReview.aggregate({ where: { artistId: a.id, status: 'APPROVED' }, _avg: { rating: true }, _count: true });
    if (agg._count) await prisma.artist.update({ where: { id: a.id }, data: { ratingAverage: agg._avg.rating ?? 0, ratingCount: agg._count } });
  }

  // A completed payout for one artist
  const arjun = artistByName('Kapoor Contemporary');
  const arjunAvailable = await prisma.artistLedger.findMany({ where: { artistId: arjun.id, status: 'AVAILABLE' } });
  const arjunTotal = arjunAvailable.reduce((s, e) => s + Math.round(Number(e.amount) * 100), 0);
  if (arjunTotal > 0) {
    const s = await prisma.settlement.create({ data: { artistId: arjun.id, amount: fromMinor(arjunTotal), status: 'COMPLETED', reference: `UTR${between(100000, 999999)}`, note: '[BANK_TRANSFER] Monthly payout', processedById: adminId, completedAt: daysAgo(3) } });
    await prisma.artistLedger.updateMany({ where: { id: { in: arjunAvailable.map((e) => e.id) } }, data: { status: 'SETTLED', settlementId: s.id } });
    await prisma.artistLedger.create({ data: { artistId: arjun.id, type: 'SETTLEMENT_DEBIT', status: 'SETTLED', amount: fromMinor(-arjunTotal), description: `Payout ${s.id}`, settlementId: s.id } });
    await prisma.settlementTransaction.create({ data: { settlementId: s.id, amount: fromMinor(arjunTotal), method: 'BANK_TRANSFER', reference: s.reference } });
  }

  // Custom art requests across the workflow
  console.log('  • custom art requests');
  const flow: CustomArtStatus[] = ['REQUESTED', 'ARTIST_REVIEWING', 'ACCEPTED', 'IN_PROGRESS', 'PREVIEW_READY', 'REVISION_REQUESTED', 'PREVIEW_READY', 'CUSTOMER_APPROVED', 'FINALIZING', 'COMPLETED'];
  const kavya = artistByName('Kavya Nair Art');
  const aiko = artistByName('Aiko Tanaka');
  const rohan = artistByName('Das Ink Works');
  const requestDefs: Array<{ customer: (typeof customers)[number]; artist: (typeof artistRows)[number]; style: string; status: CustomArtStatus; title: string; instructions: string; format: ArtworkFormat; budget: number; quote?: number }> = [
    { customer: demo, artist: meera, style: 'watercolor', status: 'REQUESTED', title: 'Family at the temple', instructions: 'Convert this family photo into a traditional Indian watercolor painting with a temple background.', format: 'ORIGINAL', budget: 6000 },
    { customer: demo, artist: meera, style: 'pencil-sketch', status: 'ACCEPTED', title: 'Grandparents portrait', instructions: 'A soft pencil sketch of my grandparents for their 50th anniversary. Please keep the background plain.', format: 'PRINT', budget: 3000, quote: 4500 },
    { customer: demo, artist: kavya, style: 'digital-painting', status: 'IN_PROGRESS', title: 'My dog Bruno', instructions: 'Colourful digital painting of my dog with a sunset background and his name in the corner.', format: 'DIGITAL', budget: 2500, quote: 2800 },
    { customer: demo, artist: meera, style: 'traditional-indian-art', status: 'PREVIEW_READY', title: 'Wedding couple, Tanjore style', instructions: 'Our wedding photo in a Tanjore-inspired style with gold accents and traditional jewellery.', format: 'ORIGINAL', budget: 12000, quote: 14000 },
    { customer: demo, artist: aiko, style: 'anime', status: 'REVISION_REQUESTED', title: 'Anime friends', instructions: 'Turn this photo of me and my best friend into an anime scene under cherry blossoms.', format: 'DIGITAL', budget: 3000, quote: 3200 },
    { customer: customers[3], artist: meera, style: 'oil-painting', status: 'CUSTOMER_APPROVED', title: 'Kerala backwaters memory', instructions: 'Oil painting from our houseboat holiday photo — warm evening light please.', format: 'ORIGINAL', budget: 9000, quote: 8000 },
    { customer: customers[2], artist: meera, style: 'watercolor', status: 'COMPLETED', title: 'Baby’s first Diwali', instructions: 'Watercolor of my daughter holding a diya. Soft pastel tones.', format: 'DIGITAL', budget: 3500, quote: 3500 },
    { customer: customers[1], artist: rohan, style: 'charcoal', status: 'REJECTED', title: 'Bike portrait', instructions: 'Charcoal drawing of my motorbike in front of Howrah bridge.', format: 'ORIGINAL', budget: 1500 },
  ];
  for (const [ri, def] of requestDefs.entries()) {
    const style = bySlug(styles, def.style);
    const created = daysAgo(30 - ri * 3);
    const req = await prisma.customArtRequest.create({
      data: {
        requestNumber: referenceCode('CA'),
        customerId: def.customer.id,
        artistId: def.artist.id,
        selectedStyleId: style.id,
        title: def.title,
        instructions: def.instructions,
        options: { background: def.instructions.includes('background') ? 'As described' : 'Artist’s choice', colors: 'Warm' },
        requestedDimensions: def.format === 'DIGITAL' ? '4000 x 5000 px' : '45 x 60 cm',
        requestedFormat: def.format,
        budget: def.budget,
        quotedPrice: def.quote,
        status: def.status,
        revisionCount: def.status === 'REVISION_REQUESTED' ? 1 : 0,
        artistMessage: def.status === 'REJECTED' ? 'Sorry — I am fully booked this month.' : def.quote ? 'Thank you! I would love to create this for you.' : null,
        createdAt: created,
      },
    });
    const src = await storeSvg(avatar(9000 + ri * 13, pick(['pastel', 'teal', 'earth'] as PaletteKey[]), 900), 'customArtSource', { thumb: false });
    await prisma.customArtImage.create({ data: { requestId: req.id, kind: 'SOURCE', storageKey: src.key, mimeType: 'image/webp', width: src.width, height: src.height, sizeBytes: src.size, uploadedById: def.customer.id, createdAt: created } });

    // Status history up to the target state
    const path: CustomArtStatus[] = def.status === 'REJECTED' ? ['REQUESTED', 'ARTIST_REVIEWING', 'REJECTED'] : flow.slice(0, flow.lastIndexOf(def.status) + 1);
    if (def.status === 'REVISION_REQUESTED') path.splice(path.lastIndexOf('REVISION_REQUESTED') + 1);
    for (const [hi, st] of path.entries()) {
      const actorRole: RoleName = ['REVISION_REQUESTED', 'CUSTOMER_APPROVED', 'COMPLETED'].includes(st) || st === 'REQUESTED' ? 'CUSTOMER' : 'ARTIST';
      await prisma.customArtStatusHistory.create({
        data: { requestId: req.id, fromStatus: hi ? path[hi - 1] : null, toStatus: st, actorId: actorRole === 'CUSTOMER' ? def.customer.id : def.artist.userId, actorRole, note: st === 'REVISION_REQUESTED' ? 'Could you make the background lighter?' : null, createdAt: new Date(created.getTime() + hi * 7_200_000) },
      });
    }
    if (path.includes('PREVIEW_READY')) {
      const prev = await storeSvg(generate('portrait', 7000 + ri, 1000, 1250, pick(['purple', 'sunset', 'pastel'] as PaletteKey[])), 'customArtPreview', { thumb: false });
      await prisma.customArtImage.create({ data: { requestId: req.id, kind: 'PREVIEW', storageKey: prev.key, mimeType: 'image/webp', width: prev.width, height: prev.height, sizeBytes: prev.size, uploadedById: def.artist.userId } });
    }
    if (def.status === 'REVISION_REQUESTED') {
      await prisma.customArtRevision.create({ data: { requestId: req.id, revisionNumber: 1, feedback: 'Could you make the background lighter and add more cherry blossoms?' } });
    }
    if (def.status === 'COMPLETED') {
      const fin = await storeSvg(generate('portrait', 7777, 1600, 2000, 'pastel'), 'customArtFinal', { thumb: false });
      await prisma.customArtImage.create({ data: { requestId: req.id, kind: 'FINAL', storageKey: fin.key, mimeType: 'image/webp', width: fin.width, height: fin.height, sizeBytes: fin.size, uploadedById: def.artist.userId } });
      // Paid order for the commission + download access
      const resolved = resolveCommission(rules, { kind: 'CUSTOM_ART', artistId: def.artist.id });
      const split = computeLine(def.quote!, 1, resolved.percentage);
      const placedAt = daysAgo(8);
      const order = await prisma.order.create({
        data: { orderNumber: referenceCode('AG'), customerId: def.customer.id, status: 'COMPLETED', paymentStatus: 'PAID', paymentMethod: 'MANUAL', subtotal: fromMinor(split.grossMinor), total: fromMinor(split.grossMinor), placedAt },
      });
      const item = await prisma.orderItem.create({
        data: { orderId: order.id, artistId: def.artist.id, customArtRequestId: req.id, titleSnapshot: `Custom art ${req.requestNumber} — ${def.title}`, format: 'DIGITAL', fulfillmentType: 'DIGITAL', fulfillmentStatus: 'DIGITAL_AVAILABLE', unitPrice: fromMinor(split.grossMinor), quantity: 1, lineTotal: fromMinor(split.grossMinor), commissionRate: resolved.percentage, commissionAmount: fromMinor(split.commissionMinor), artistAmount: fromMinor(split.artistMinor), createdAt: placedAt },
      });
      await prisma.commission.create({ data: { orderItemId: item.id, ruleScope: resolved.scope, ruleId: resolved.ruleId, percentage: resolved.percentage, grossAmount: fromMinor(split.grossMinor), amount: fromMinor(split.commissionMinor), artistAmount: fromMinor(split.artistMinor) } });
      await prisma.artistLedger.createMany({
        data: [
          { artistId: def.artist.id, type: 'SALE_CREDIT', status: 'AVAILABLE', amount: fromMinor(split.grossMinor), description: `Custom art ${req.requestNumber} (${order.orderNumber})`, orderItemId: item.id, createdAt: placedAt },
          { artistId: def.artist.id, type: 'COMMISSION_DEBIT', status: 'AVAILABLE', amount: fromMinor(-split.commissionMinor), description: `Platform commission ${resolved.percentage}% (${order.orderNumber})`, orderItemId: item.id, createdAt: placedAt },
        ],
      });
      await prisma.payment.create({ data: { orderId: order.id, provider: 'manual', method: 'MANUAL', status: 'PAID', amount: fromMinor(split.grossMinor), providerRef: `UTR${between(100000, 999999)}`, confirmedById: adminId, confirmedAt: placedAt } });
      await prisma.downloadAccess.create({ data: { orderItemId: item.id, userId: def.customer.id, storageKey: fin.key, maxDownloads: config.DIGITAL_DOWNLOAD_LIMIT, expiresAt: new Date(Date.now() + config.DIGITAL_DOWNLOAD_EXPIRY_DAYS * 86_400_000) } });
    }
  }

  // Banners (hero)
  console.log('  • banners & notifications');
  const heroDefs: Array<{ title: string; subtitle: string; link: string; svg: string }> = [
    { title: 'Art That Tells Your Story', subtitle: 'Discover original artworks or transform your favorite memories into beautiful art.', link: '/gallery', svg: treeOfLife(new Ctx(mulberry32(777), 1920, 1080, PALETTES.carnival.colors), { depth: 8 }) },
    { title: 'Turn Your Photo Into Art', subtitle: 'Upload a photo, choose a style and a real artist paints it for you.', link: '/create-your-art', svg: generate('portrait', 31337, 1920, 1080, 'purple') },
    { title: 'Indian Heritage Collection', subtitle: 'Mandalas, temple towns and living traditions.', link: '/collections/indian-heritage', svg: generate('mandala', 4242, 1920, 1080, 'crimson') },
  ];
  for (const [i, b] of heroDefs.entries()) {
    const img = await storeSvg(b.svg, 'site', { thumb: false, quality: 88 });
    await prisma.banner.create({ data: { title: b.title, subtitle: b.subtitle, imageUrl: img.url!, linkUrl: b.link, placement: 'HOME_HERO', sortOrder: i } });
  }

  const notifyUsers = [
    { userId: demo.id, type: 'WELCOME', title: 'Welcome to Art Gallery', body: 'Explore original art or create your own from a photo.', link: '/create-your-art' },
    { userId: meera.userId, type: 'NEW_ORDER', title: 'New order received', body: 'A collector ordered 2 prints of your artwork.', link: '/seller/orders' },
    { userId: meera.userId, type: 'CUSTOM_ART_NEW', title: 'New custom art request', body: 'Priya Sharma requested a watercolor painting.', link: '/seller/custom-art' },
    { userId: adminId, type: 'ARTIST_PENDING', title: 'New artist awaiting approval', body: 'Mehta Murals registered as an artist.', link: '/admin/artists' },
  ];
  await prisma.notification.createMany({ data: notifyUsers });

  await prisma.report.create({ data: { reporterId: customers[4].id, targetType: 'ARTWORK', targetId: artworks[7].id, reason: 'COPYRIGHT', details: 'This looks similar to a piece I saw elsewhere — please verify.' } });

  return { artists: artistRows.length, artworks: artworks.length + 1, customers: customers.length, collections: collections.length, requests: requestDefs.length };
}

async function main() {
  console.log('🌱 Seeding reference data…');
  const { admin, adminEmail, adminPassword } = await seedReference();

  const existing = await prisma.artwork.count();
  let summary: Awaited<ReturnType<typeof seedDemo>> | null = null;
  // Demo content is on by default in development and opt-in (SEED_DEMO=true) in production.
  const demoEnabled = process.env.NODE_ENV === 'production' ? process.env.SEED_DEMO === 'true' : process.env.SEED_DEMO !== 'false';
  if (existing === 0 && demoEnabled) {
    console.log('🎨 Generating demo content (procedural artwork)…');
    summary = await seedDemo(admin.id);
  } else {
    console.log(`ℹ️  ${existing} artworks already exist — skipping demo content (idempotent).`);
  }

  const counts = {
    users: await prisma.user.count(),
    artists: await prisma.artist.count(),
    artworks: await prisma.artwork.count(),
    collections: await prisma.artworkCollection.count(),
    orders: await prisma.order.count(),
    customArtRequests: await prisma.customArtRequest.count(),
    reviews: await prisma.artworkReview.count(),
    categories: await prisma.artworkCategory.count(),
    styles: await prisma.artworkStyle.count(),
  };
  console.log('\n✅ Seed complete', counts);
  console.log('\nLogin credentials:');
  console.log(`  Admin     ${adminEmail} / ${process.env.SEED_ADMIN_PASSWORD ? '(SEED_ADMIN_PASSWORD from env)' : adminPassword}`);
  if (summary || existing) {
    console.log('  Artist    artist@artgallery.local / Artist@12345   (Meera Iyer Studio — approved)');
    console.log('  Customer  customer@artgallery.local / Customer@12345 (Priya Sharma)');
    console.log('  Other demo artists: <name>@artgallery.local / Artist@12345 · pending artist: rahul.mehta@artgallery.local');
  }
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

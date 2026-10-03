/**
 * Replace demo artwork imagery with real, topic-matched art from Wikimedia Commons.
 *
 *   npm run images:topics -- plan    → searches Commons, writes uploads/topic-images/plan.json + contact-sheet.jpg
 *   npm run images:topics -- apply   → downloads the planned images, stores them, updates the demo catalogue
 *
 * Only freely licensed files are used (Public domain, CC0, CC BY, CC BY-SA, FAL); each artwork's
 * copyrightInfo/licenseInfo records the original title, author, licence and source page.
 * Files listed in EXCLUDED_FILES (manual review) are never used.
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { processAndStoreImage, storeOriginalImage } from '../src/shared/images.js';
import { storage } from '../src/providers/storage/index.js';
import { Ctx, PALETTES, generate, mulberry32, treeOfLife } from './art-generator.js';

const prisma = new PrismaClient();
const UA = 'MyMoonsGalleryDev/1.0 (art marketplace demo seeding; contact: admin@mymoonsgallery.com)';
const OUT_DIR = path.resolve('uploads', 'topic-images');
const PLAN_FILE = path.join(OUT_DIR, 'plan.json');

/** Search terms per topic. Artworks use their style first, then category. */
const STYLE_QUERIES: Record<string, string[]> = {
  watercolor: ['Winslow Homer watercolor', 'Turner watercolour landscape', 'John Singer Sargent watercolor'],
  'oil-painting': ['Albert Bierstadt painting', 'Ivan Aivazovsky painting', 'Isaac Levitan painting'],
  'pencil-sketch': ['Albrecht Durer drawing', 'Leonardo da Vinci drawing study', 'Rembrandt drawing'],
  charcoal: ['Van Gogh drawing', 'Kathe Kollwitz drawing', 'Rembrandt drawing'],
  'line-art': ['Albrecht Durer engraving', 'Rembrandt etching', 'Hokusai manga'],
  mandala: ['mandala thangka Google Art Project', 'Tibetan thangka painting'],
  'traditional-indian-art': ['Kangra painting', 'Pahari painting Google Art Project', 'Raja Ravi Varma painting'],
  'folk-art': ['Kalighat painting', 'Madhubani painting', 'Pahari painting'],
  'pop-art': ['Alphonse Mucha lithograph', 'Jules Cheret poster'],
  cartoon: ['Toulouse-Lautrec poster', 'Jules Cheret poster'],
  anime: ['Hokusai woodblock print', 'Hiroshige woodblock print', 'Hiroshige ukiyo-e'],
  abstract: ['Kandinsky painting', 'Paul Klee painting', 'Piet Mondrian composition'],
  contemporary: ['Franz Marc painting', 'August Macke painting', 'Egon Schiele landscape'],
  modern: ['Robert Delaunay painting', 'Juan Gris painting', 'Kazimir Malevich painting'],
  minimalist: ['Vilhelm Hammershoi painting', 'Whistler nocturne', 'Hiroshige snow'],
  realistic: ['Johannes Vermeer painting', 'Ivan Shishkin painting', 'still life painting Google Art Project'],
  'digital-painting': ['Claude Monet painting', 'Pierre-Auguste Renoir painting', 'Van Gogh painting Google Art Project'],
  vintage: ['Alphonse Mucha poster', 'art nouveau poster lithograph'],
};

const CATEGORY_QUERIES: Record<string, string[]> = {
  paintings: ['Claude Monet water lilies', 'Van Gogh painting Google Art Project'],
  portraits: ['Johannes Vermeer girl', 'John Singer Sargent portrait', 'Raja Ravi Varma portrait'],
  'abstract-art': ['Kandinsky composition', 'Paul Klee painting'],
  'digital-art': ['Van Gogh Irises', 'Claude Monet painting'],
  photography: ['Ansel Adams photograph', 'Ansel Adams National Park'],
  illustrations: ['Alphonse Mucha illustration', 'botanical illustration Google Art Project'],
  sculptures: ['bust Getty Museum', 'marble sculpture Louvre', 'Rodin sculpture'],
  calligraphy: ['calligraphy Google Art Project', 'Ottoman calligraphy', 'Chinese calligraphy Google Art Project'],
  'traditional-art': ['Kangra painting', 'Indian miniature painting'],
  'modern-art': ['Robert Delaunay painting', 'cubism painting Google Art Project'],
  'contemporary-art': ['Franz Marc painting', 'August Macke painting'],
  'minimalist-art': ['Vilhelm Hammershoi painting', 'Whistler nocturne'],
  'landscape-art': ['Albert Bierstadt painting', 'Ivan Shishkin painting'],
  'religious-art': ['thangka Google Art Project', 'Raja Ravi Varma goddess'],
  'cultural-art': ['Raja Ravi Varma', 'Pahari painting'],
  'wall-art': ['Gustav Klimt landscape', 'Gustav Klimt Attersee', 'Alphonse Mucha seasons'],
  'custom-art': ['Carl Larsson family', 'Pierre-Auguste Renoir portrait'],
};

const BANNER_QUERIES = ['Gustav Klimt Tree of Life Stoclet', 'Van Gogh Starry Night Google Art Project', 'Great Wave off Kanagawa Hokusai'];

const OK_LICENSE = /^(public domain|pd|cc0|cc by(-sa)? [\d.]+|cc by(-sa)?|fal)/i;
/** Off-topic subjects and content unsuitable for a family-friendly storefront. */
const EXCLUDE_TITLE =
  /(nude|naked|\bnu\b|venus|bath|bather|odalisque|susanna|leda|danae|erotic|kiss|shunga|utamaro|prophet|muhammad|crucifix|map|atlas|church|kirche|\bdom\b|cathedral|chapel|interior of|costume design|door|building|parking|station|pyramid|whale|skull|execution|battle|\bwar\b|massacre|death|dead|corpse|blood|hunting|martyr|plague|\bLBS\b|staircase|glacier|massif|carbon|graphite|rotring|letter|signature|stamp|coin|exhibition view|installation|\badam\b|\beve\b|dante|inferno|jungfrau|judith|salome|baker|\bakt\b|horsemen|apocalypse|hunter|\bhunt\b|sebastian|dornac|ghost|koheiji|yurei|krank|nackt|yoro|yōrō|champenois|gespenst|rawpixel|hyaku monogatari|sara yashiki|sarayashiki)/i;
/** Filled in after manual contact-sheet review. */
const EXCLUDED_FILES = new Set<string>([
  "Ukiyo-e woodblock print by Katsushika Hokusai, digitally enhanced by rawpixel-com 5.jpg",
  "Mary Cassatt, Mother and Child, c. 1905, NGA 46573.jpg",
  "Vincent van Gogh - Sorrow.jpg",
  "Mother and Child - Cassatt 1905.jpg",
  "Jaroslava Mucha by Alfons Mucha.jpg",
  "Jaroslava Mucha by Alphonse Mucha (1860-1939).jpg",
  "Great Wave off Kanagawa2.jpg",
  "Tsunami by hokusai 19th century.jpg",
  "Great Wave unrestored.jpg",
  "Albrecht Dürer - Betende Hände, 1508.jpg",
  "Marc Weidende Pferde I PA291029.jpg",
]);

interface Candidate {
  file: string;
  url: string; // ~1600px rendition
  pageUrl: string;
  author: string;
  license: string;
  width: number;
  height: number;
}

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

interface CommonsImageInfo {
  thumburl?: string;
  descriptionurl: string;
  width: number;
  height: number;
  extmetadata?: { LicenseShortName?: { value: string }; Artist?: { value: string } };
}

async function search(query: string, featuredOnly: boolean): Promise<Candidate[]> {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  const filter = featuredOnly ? ' incategory:Featured_pictures_on_Wikimedia_Commons' : '';
  Object.entries({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '30',
    gsrsearch: `${query} filetype:bitmap${filter}`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '1600',
    iiextmetadatafilter: 'LicenseShortName|Artist',
  }).forEach(([k, v]) => url.searchParams.set(k, v));
  let res: Response | null = null;
  for (let attempt = 1; attempt <= 4 && !res?.ok; attempt++) {
    res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
    if (!res?.ok) await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  if (!res?.ok) throw new Error(`Commons search failed for "${query}"`);
  const json = (await res.json()) as { query?: { pages?: Record<string, { title: string; index: number; imageinfo?: Array<CommonsImageInfo> }> } };
  return Object.values(json.query?.pages ?? {})
    .sort((a, b) => a.index - b.index)
    .flatMap((p) => {
      const ii = p.imageinfo?.[0];
      if (!ii?.thumburl) return [];
      const license = stripHtml(ii.extmetadata?.LicenseShortName?.value ?? '');
      return [
        {
          file: p.title.replace(/^File:/, ''),
          url: ii.thumburl as string,
          pageUrl: ii.descriptionurl as string,
          author: stripHtml(ii.extmetadata?.Artist?.value ?? 'Unknown').slice(0, 180) || 'Unknown',
          license,
          width: ii.width as number,
          height: ii.height as number,
        },
      ];
    });
}

const GENERIC_WORDS = new Set(
  'painting paintings drawing drawings print prints poster posters google project lithograph woodblock engraving etching study composition portrait landscape photograph museum illustration panel sculpture marble bronze bust louvre getty national park girl child mother goddess snow nocturne interior still life water lilies ukiyo calligraphy indian miniature'.split(' '),
);
const normalize = (s: string) =>
  s.toLowerCase().replace(/ø/g, 'o').replace(/æ/g, 'ae').normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** The result must name the searched artist/subject (in its title or author), not just loosely match. */
function matchesAnchor(c: Candidate, query: string) {
  const anchors = normalize(query)
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w));
  if (anchors.length === 0) return true;
  const haystack = normalize(`${c.file} ${c.author}`);
  return anchors.some((a) => haystack.includes(a));
}

function acceptable(c: Candidate, used: Set<string>, query: string) {
  const ratio = c.width / c.height;
  return (
    matchesAnchor(c, query) &&
    !used.has(c.file) &&
    !EXCLUDED_FILES.has(c.file) &&
    OK_LICENSE.test(c.license) &&
    !EXCLUDE_TITLE.test(c.file) &&
    c.width >= 1200 &&
    ratio > 0.55 &&
    ratio < 2.1
  );
}

const cache = new Map<string, Candidate[]>();
/** Hero banner subjects: reserved for the banners so the same famous work doesn't repeat across the site. */
const BANNER_SUBJECTS = /(kanagawa|nami ura|great wave|tree of life|lebensbaum|starry night|nuit etoilee)/i;

async function pick(queries: string[], used: Set<string>, opts: { allowBannerSubjects?: boolean } = {}): Promise<Candidate | null> {
  // Most specific query first; within a query prefer Commons "featured" (curated quality) files.
  for (const q of queries) {
    for (const featured of [true, false]) {
      const key = `${featured}:${q}`;
      if (!cache.has(key)) {
        cache.set(key, await search(q, featured));
        await new Promise((r) => setTimeout(r, 250)); // be polite to the API
      }
      const found = cache
        .get(key)!
        .find((c) => acceptable(c, used, q) && (opts.allowBannerSubjects || !BANNER_SUBJECTS.test(normalize(c.file))));
      if (found) {
        used.add(found.file);
        return found;
      }
    }
  }
  return null;
}

/** Stand-ins for customer-uploaded photos on demo custom-art requests (private storage only). */
// Public-domain paintings of families/people stand in for customer photos, so no real person's photo is used.
const SOURCE_PHOTO_QUERIES = ['Carl Larsson painting', 'Mary Cassatt painting', 'Berthe Morisot painting', 'Pierre-Auguste Renoir portrait'];

interface Plan {
  artworks: Array<{ artworkId: string; title: string; topic: string; image: Candidate }>;
  categories: Array<{ slug: string; image: Candidate }>;
  banners: Array<{ bannerId: string; image: Candidate }>;
  /** Private: one source photo + one styled result (used for previews and finals) per custom-art request. */
  customArt: Array<{ requestId: string; requestNumber: string; style: string; source: Candidate; result: Candidate }>;
}

async function plan() {
  const used = new Set<string>();
  const artworks = await prisma.artwork.findMany({
    select: { id: true, title: true, style: { select: { slug: true } }, category: { select: { slug: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const result: Plan = { artworks: [], categories: [], banners: [], customArt: [] };

  // Banners first, so the signature works go to the hero.
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  for (const [i, b] of banners.entries()) {
    const image = await pick([BANNER_QUERIES[i % BANNER_QUERIES.length]], used, { allowBannerSubjects: true });
    if (image) result.banners.push({ bannerId: b.id, image });
  }
  for (const a of artworks) {
    const queries = [...(STYLE_QUERIES[a.style?.slug ?? ''] ?? []), ...(CATEGORY_QUERIES[a.category?.slug ?? ''] ?? [])];
    const image = await pick(queries, used);
    if (image) result.artworks.push({ artworkId: a.id, title: a.title, topic: `${a.category?.slug}/${a.style?.slug}`, image });
    else console.warn(`No image found for ${a.title}`);
  }
  for (const [slug, queries] of Object.entries(CATEGORY_QUERIES)) {
    const image = await pick(queries, used);
    if (image) result.categories.push({ slug, image });
  }
  const requests = await prisma.customArtRequest.findMany({
    where: { images: { some: {} } },
    select: { id: true, requestNumber: true, selectedStyle: { select: { slug: true } } },
    orderBy: { createdAt: 'asc' },
  });
  for (const [i, r] of requests.entries()) {
    const style = r.selectedStyle?.slug ?? 'watercolor';
    const rotated = [...SOURCE_PHOTO_QUERIES.slice(i % SOURCE_PHOTO_QUERIES.length), ...SOURCE_PHOTO_QUERIES];
    const source = await pick(rotated, used);
    const styled = await pick([...(STYLE_QUERIES[style] ?? []), ...CATEGORY_QUERIES['custom-art']], used);
    if (source && styled) result.customArt.push({ requestId: r.id, requestNumber: r.requestNumber, style, source, result: styled });
    else console.warn(`No private images found for ${r.requestNumber}`);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(PLAN_FILE, JSON.stringify(result, null, 2));
  await contactSheet(result);
  console.log(
    `Planned ${result.artworks.length} artworks, ${result.categories.length} categories, ${result.banners.length} banners, ` +
      `${result.customArt.length} custom-art requests → ${PLAN_FILE}`,
  );
}

async function download(url: string): Promise<Buffer> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
    if (res?.ok) return Buffer.from(await res.arrayBuffer());
    if (res && res.status !== 429 && res.status < 500) throw new Error(`Download failed ${res.status}: ${url}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
  throw new Error(`Download failed after retries: ${url}`);
}

/** Downloads are cached on disk so `apply` reuses what `plan` fetched for the contact sheet. */
async function fetchImage(c: Candidate) {
  const cacheFile = path.join(OUT_DIR, 'cache', crypto.createHash('sha1').update(c.url).digest('hex'));
  const cached = await fs.readFile(cacheFile).catch(() => null);
  if (cached) return cached;
  const buf = await download(c.url);
  await fs.mkdir(path.dirname(cacheFile), { recursive: true });
  await fs.writeFile(cacheFile, buf);
  await new Promise((r) => setTimeout(r, 200));
  return buf;
}

/** A numbered grid of every planned image, for human review before applying. */
async function contactSheet(p: Plan) {
  const items = [
    ...p.artworks.map((a) => ({ label: `A ${a.title}`, c: a.image })),
    ...p.categories.map((c) => ({ label: `C ${c.slug}`, c: c.image })),
    ...p.banners.map((b, i) => ({ label: `B banner ${i + 1}`, c: b.image })),
    ...p.customArt.flatMap((r) => [
      { label: `P src ${r.requestNumber}`, c: r.source },
      { label: `P ${r.style}`, c: r.result },
    ]),
  ];
  const cell = 220;
  const cols = 10;
  const rows = Math.ceil(items.length / cols);
  const tiles: sharp.OverlayOptions[] = [];
  for (const [i, it] of items.entries()) {
    const buf = await fetchImage(it.c);
    const img = await sharp(buf).resize(cell, cell - 30, { fit: 'cover' }).toBuffer();
    const label = Buffer.from(
      `<svg width="${cell}" height="30"><rect width="100%" height="100%" fill="#111"/><text x="4" y="20" font-size="13" fill="#fff" font-family="Arial">${i} ${it.label.replace(/&/g, '&amp;').replace(/</g, '&lt;').slice(0, 26)}</text></svg>`,
    );
    const x = (i % cols) * cell;
    const y = Math.floor(i / cols) * cell;
    tiles.push({ input: img, left: x, top: y }, { input: label, left: x, top: y + cell - 30 });
  }
  await sharp({ create: { width: cols * cell, height: rows * cell, channels: 3, background: '#222' } })
    .composite(tiles)
    .jpeg({ quality: 80 })
    .toFile(path.join(OUT_DIR, 'contact-sheet.jpg'));
}

const asUpload = (buffer: Buffer, name: string) => ({ fieldname: 'image', originalname: name, mimetype: 'image/jpeg', size: buffer.length, buffer });

function credit(c: Candidate) {
  return `Image: "${c.file.replace(/\.[a-z]+$/i, '')}" by ${c.author} — ${c.license}, via Wikimedia Commons (${c.pageUrl}). Demo catalogue image.`;
}

async function apply() {
  const p = JSON.parse(await fs.readFile(PLAN_FILE, 'utf8')) as Plan;
  const stored = new Map<string, Awaited<ReturnType<typeof processAndStoreImage>>>();
  const store = async (c: Candidate) => {
    if (!stored.has(c.file)) {
      const buf = await fetchImage(c);
      // jpeg conversion first: Commons renditions can be PNG/TIFF-derived; the pipeline re-encodes to WebP.
      const jpg = await sharp(buf).jpeg({ quality: 92 }).toBuffer();
      stored.set(c.file, await processAndStoreImage(asUpload(jpg, c.file), 'artworks', { minWidth: 300, minHeight: 300, maxDimension: 2000 }));
    }
    return stored.get(c.file)!;
  };

  for (const a of p.artworks) {
    const img = await store(a.image);
    const ratio = img.width / img.height;
    await prisma.$transaction([
      prisma.artworkImage.deleteMany({ where: { artworkId: a.artworkId } }),
      prisma.artworkImage.create({
        data: {
          artworkId: a.artworkId,
          url: img.main.url!,
          thumbUrl: img.thumb?.url ?? null,
          storageKey: img.main.key,
          width: img.width,
          height: img.height,
          isPrimary: true,
          altText: a.title,
        },
      }),
      prisma.artwork.update({
        where: { id: a.artworkId },
        data: {
          thumbnailUrl: img.thumb?.url ?? img.main.url,
          previewUrl: img.main.url,
          orientation: ratio > 1.15 ? 'LANDSCAPE' : ratio < 0.87 ? 'PORTRAIT' : 'SQUARE',
          copyrightInfo: credit(a.image).slice(0, 1000),
          licenseInfo: `Source image licence: ${a.image.license}. Demo listing for development only.`,
        },
      }),
    ]);
    console.log(`✓ ${a.title} ← ${a.image.file}`);
  }

  for (const c of p.categories) {
    const img = await store(c.image);
    await prisma.artworkCategory.update({ where: { slug: c.slug }, data: { imageUrl: img.main.url } });
  }
  // The generated hero banners are preferred; only replace them when explicitly asked.
  for (const b of process.argv.includes('--banners') ? p.banners : []) {
    const img = await store(b.image);
    await prisma.banner.update({ where: { id: b.bannerId }, data: { imageUrl: img.main.url } });
  }

  // Styles, collections and galleries reuse the new artwork imagery.
  const styles = await prisma.artworkStyle.findMany({ select: { id: true } });
  for (const s of styles) {
    const w = await prisma.artwork.findFirst({ where: { styleId: s.id, previewUrl: { not: null } }, orderBy: { salesCount: 'desc' } });
    const fallback = p.categories[styles.indexOf(s) % p.categories.length];
    const url = w?.previewUrl ?? (fallback ? (await store(fallback.image)).main.url : null);
    if (url) await prisma.artworkStyle.update({ where: { id: s.id }, data: { imageUrl: url } });
  }
  for (const col of await prisma.artworkCollection.findMany({ include: { items: { include: { artwork: true }, orderBy: { sortOrder: 'asc' }, take: 1 } } })) {
    const url = col.items[0]?.artwork.previewUrl;
    if (url) await prisma.artworkCollection.update({ where: { id: col.id }, data: { coverImageUrl: url } });
  }
  for (const g of await prisma.gallery.findMany({ select: { id: true, artistId: true } })) {
    const w = await prisma.artwork.findFirst({ where: { artistId: g.artistId, previewUrl: { not: null } }, orderBy: { createdAt: 'asc' } });
    if (w) {
      await prisma.gallery.update({ where: { id: g.id }, data: { coverImageUrl: w.previewUrl } });
      await prisma.artist.update({ where: { id: g.artistId }, data: { coverImageUrl: w.previewUrl } });
    }
  }
  // Order snapshots of demo orders should show the new imagery too.
  for (const a of p.artworks) {
    const w = await prisma.artwork.findUnique({ where: { id: a.artworkId }, select: { thumbnailUrl: true } });
    await prisma.orderItem.updateMany({ where: { artworkId: a.artworkId }, data: { imageSnapshot: w?.thumbnailUrl } });
  }
  // ── Private files ── never written to public storage; served only through signed URLs.
  const replaceKey = async (oldKey: string, newKey: string) =>
    prisma.downloadAccess.updateMany({ where: { storageKey: oldKey }, data: { storageKey: newKey } });

  // Digital deliverables: full-quality original of each DIGITAL artwork's new image.
  let digitalCount = 0;
  for (const a of p.artworks) {
    const w = await prisma.artwork.findUnique({ where: { id: a.artworkId }, select: { digitalFileKey: true } });
    if (!w?.digitalFileKey) continue;
    const jpg = await sharp(await fetchImage(a.image)).jpeg({ quality: 95 }).toBuffer();
    const { stored: file } = await storeOriginalImage(asUpload(jpg, a.image.file), 'digitalArt', { minWidth: 300, minHeight: 300 });
    await prisma.artwork.update({ where: { id: a.artworkId }, data: { digitalFileKey: file.key } });
    await replaceKey(w.digitalFileKey, file.key);
    await storage.delete(w.digitalFileKey, 'private').catch(() => undefined);
    digitalCount++;
  }

  // Custom-art requests: customer source photo, artist previews and final artwork.
  for (const r of p.customArt) {
    const images = await prisma.customArtImage.findMany({ where: { requestId: r.requestId } });
    const [sourceBuf, resultBuf] = await Promise.all([fetchImage(r.source), fetchImage(r.result)]);
    const sourceJpg = await sharp(sourceBuf).jpeg({ quality: 92 }).toBuffer();
    const resultJpg = await sharp(resultBuf).jpeg({ quality: 92 }).toBuffer();
    for (const img of images) {
      let key: string;
      let width: number;
      let height: number;
      let size: number;
      let mime: string;
      if (img.kind === 'FINAL') {
        const out = await storeOriginalImage(asUpload(resultJpg, r.result.file), 'customArtFinal', { minWidth: 300, minHeight: 300 });
        ({ key, size } = out.stored);
        ({ width, height } = out);
        mime = out.stored.contentType;
      } else {
        const area = img.kind === 'PREVIEW' ? 'customArtPreview' : 'customArtSource';
        const buf = img.kind === 'PREVIEW' ? resultJpg : sourceJpg;
        // Same pipeline as real customer uploads: re-encoded, metadata stripped, private.
        const out = await processAndStoreImage(asUpload(buf, 'photo.jpg'), area, { thumbnail: false, maxDimension: 1600, minWidth: 300, minHeight: 300 });
        ({ key, size } = out.main);
        ({ width, height } = out);
        mime = 'image/webp';
      }
      await prisma.customArtImage.update({ where: { id: img.id }, data: { storageKey: key, width, height, sizeBytes: size, mimeType: mime } });
      await replaceKey(img.storageKey, key);
      await storage.delete(img.storageKey, 'private').catch(() => undefined);
    }
    console.log(`✓ ${r.requestNumber} (private) ← ${r.source.file.slice(0, 40)} / ${r.result.file.slice(0, 40)}`);
  }

  console.log(
    `Applied ${p.artworks.length} artwork images, ${p.categories.length} category covers, ${p.banners.length} banners, ` +
      `${digitalCount} digital files, ${p.customArt.length} custom-art requests (private).`,
  );
}

/**
 * Delete local upload files that no database row references any more (the replaced demo images).
 * Local storage only; dry-run unless "--yes" is passed.
 */
async function cleanup(confirm: boolean) {
  const root = path.resolve(process.env.LOCAL_UPLOAD_DIR ?? 'uploads');
  const referenced = new Set<string>();
  const addUrl = (u?: string | null) => {
    const m = u?.match(/\/media\/(.+)$/);
    if (m) referenced.add(`public/${decodeURIComponent(m[1])}`);
  };
  const addKey = (k: string | null | undefined, visibility: 'public' | 'private') => k && referenced.add(`${visibility}/${k}`);

  for (const r of await prisma.artworkImage.findMany()) {
    addUrl(r.url);
    addUrl(r.thumbUrl);
    addKey(r.storageKey, 'public');
  }
  for (const r of await prisma.artwork.findMany()) {
    addUrl(r.thumbnailUrl);
    addUrl(r.previewUrl);
    addKey(r.digitalFileKey, 'private');
  }
  for (const r of await prisma.artworkCategory.findMany()) addUrl(r.imageUrl);
  for (const r of await prisma.artworkStyle.findMany()) addUrl(r.imageUrl);
  for (const r of await prisma.artworkCollection.findMany()) addUrl(r.coverImageUrl);
  for (const r of await prisma.gallery.findMany()) addUrl(r.coverImageUrl);
  for (const r of await prisma.galleryImage.findMany()) {
    addUrl(r.url);
    addKey(r.storageKey, 'public');
  }
  for (const r of await prisma.artist.findMany()) {
    addUrl(r.avatarUrl);
    addUrl(r.coverImageUrl);
  }
  for (const r of await prisma.user.findMany({ select: { avatarUrl: true } })) addUrl(r.avatarUrl);
  for (const r of await prisma.banner.findMany()) addUrl(r.imageUrl);
  for (const r of await prisma.reviewImage.findMany()) {
    addUrl(r.url);
    addKey(r.storageKey, 'public');
  }
  for (const r of await prisma.orderItem.findMany({ select: { imageSnapshot: true } })) addUrl(r.imageSnapshot);
  for (const r of await prisma.customArtImage.findMany()) addKey(r.storageKey, 'private');
  for (const r of await prisma.downloadAccess.findMany()) addKey(r.storageKey, 'private');
  for (const r of await prisma.artistDocument.findMany()) addKey(r.storageKey, 'private');

  const orphans: string[] = [];
  const walk = async (dir: string) => {
    for (const e of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (!referenced.has(path.relative(root, full).split(path.sep).join('/'))) orphans.push(full);
    }
  };
  await walk(path.join(root, 'public'));
  await walk(path.join(root, 'private'));

  let bytes = 0;
  for (const f of orphans) {
    bytes += (await fs.stat(f)).size;
    if (confirm) await fs.rm(f);
  }
  console.log(
    `${confirm ? 'Deleted' : 'Would delete'} ${orphans.length} unreferenced files (${(bytes / 1048576).toFixed(1)} MB); ` +
      `${referenced.size} referenced files kept.${confirm ? '' : ' Re-run with --yes to delete.'}`,
  );
}

/** Put back the original generated hero banners (same seeds as prisma/seed.ts, so identical images). */
async function restoreBanners() {
  const svgs = [
    treeOfLife(new Ctx(mulberry32(777), 1920, 1080, PALETTES.carnival.colors), { depth: 8 }),
    generate('portrait', 31337, 1920, 1080, 'purple'),
    generate('mandala', 4242, 1920, 1080, 'crimson'),
  ];
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  for (const [i, b] of banners.entries()) {
    const data = await sharp(Buffer.from(svgs[i % svgs.length])).webp({ quality: 88 }).toBuffer();
    const img = await storage.put('site', `${Date.now()}-hero-${i}.webp`, data, 'image/webp');
    await prisma.banner.update({ where: { id: b.id }, data: { imageUrl: img.url! } });
    console.log(`✓ banner "${b.title}" restored`);
  }
}

const mode = process.argv[2];
(mode === 'apply'
  ? apply()
  : mode === 'plan'
    ? plan()
    : mode === 'restore-banners'
      ? restoreBanners()
      : mode === 'cleanup'
      ? cleanup(process.argv.includes('--yes'))
      : Promise.reject(new Error('Usage: images:topics -- plan|apply|restore-banners|cleanup [--yes]')))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

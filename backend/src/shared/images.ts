import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { config } from '../config/env.js';
import { storage, type StorageArea, type StoredObject } from '../providers/storage/index.js';
import { badRequest } from './errors.js';
import type { UploadedFile } from './http.js';
import { fileScanner } from './file-scanner.js';

export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);

export interface ImageRules {
  minWidth?: number;
  minHeight?: number;
  maxPixels?: number;
  maxBytes?: number;
}

const DEFAULT_RULES: Required<ImageRules> = {
  minWidth: 200,
  minHeight: 200,
  maxPixels: 80_000_000, // ~ 10000 x 8000
  maxBytes: 0,
};

export interface ValidatedImage {
  width: number;
  height: number;
  format: string;
}

/**
 * Validates an uploaded image by its *content*, not its name or declared type:
 * 1. declared MIME must be in the allow-list,
 * 2. size limit,
 * 3. the bytes must decode as JPEG/PNG/WebP (magic-number + full header parse by libvips),
 * 4. dimension bounds (and decompression-bomb guard via limitInputPixels),
 * 5. malware scanner hook.
 */
export async function validateImage(file: UploadedFile, rules: ImageRules = {}): Promise<ValidatedImage> {
  const r = { ...DEFAULT_RULES, ...rules, maxBytes: rules.maxBytes ?? config.maxUploadBytes };
  if (!ALLOWED_IMAGE_MIME.includes(file.mimetype as (typeof ALLOWED_IMAGE_MIME)[number])) {
    throw badRequest(`Unsupported file type "${file.mimetype}". Use JPEG, PNG or WebP.`);
  }
  if (file.size === 0 || file.buffer.length === 0) throw badRequest('Empty file');
  if (file.buffer.length > r.maxBytes) throw badRequest(`File exceeds ${Math.round(r.maxBytes / 1048576)}MB limit`);

  let meta: Awaited<ReturnType<ReturnType<typeof sharp>['metadata']>>;
  try {
    meta = await sharp(file.buffer, { limitInputPixels: r.maxPixels, failOn: 'error' }).metadata();
  } catch {
    throw badRequest('File is not a valid image');
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) throw badRequest('File is not a valid JPEG, PNG or WebP image');
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < r.minWidth || height < r.minHeight) {
    throw badRequest(`Image is too small (${width}x${height}). Minimum is ${r.minWidth}x${r.minHeight}px.`);
  }
  if (width * height > r.maxPixels) throw badRequest('Image dimensions are too large');

  const scan = await fileScanner.scan(file.buffer);
  if (!scan.clean) throw badRequest('File failed security scan');

  return { width, height, format: meta.format };
}

export interface ProcessedImage {
  main: StoredObject;
  thumb: StoredObject | null;
  width: number;
  height: number;
}

/**
 * Validate, then RE-ENCODE the image. Re-encoding strips EXIF/GPS metadata (important for
 * customer personal photos) and neutralises polyglot files that embed scripts in image bytes.
 */
export async function processAndStoreImage(
  file: UploadedFile,
  area: StorageArea,
  opts: ImageRules & { maxDimension?: number; thumbnail?: boolean; quality?: number } = {},
): Promise<ProcessedImage> {
  await validateImage(file, opts);
  const id = `${Date.now()}-${nanoid(12)}`;
  const maxDim = opts.maxDimension ?? 1600;

  const pipeline = sharp(file.buffer, { limitInputPixels: opts.maxPixels ?? DEFAULT_RULES.maxPixels })
    .rotate() // apply EXIF orientation before metadata is dropped
    .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true });

  const { data, info } = await pipeline.clone().webp({ quality: opts.quality ?? 80 }).toBuffer({ resolveWithObject: true });
  const main = await storage.put(area, `${id}.webp`, data, 'image/webp');

  let thumb: StoredObject | null = null;
  if (opts.thumbnail !== false) {
    const t = await sharp(data).resize({ width: 640, height: 640, fit: 'inside' }).webp({ quality: 78 }).toBuffer();
    thumb = await storage.put(area, `${id}-thumb.webp`, t, 'image/webp');
    // Medium variant (<name>-md.webp) used by tiles and covers; the web app falls back to the main file.
    const md = await sharp(data).resize({ width: 960, height: 960, fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
    await storage.put(area, `${id}-md.webp`, md, 'image/webp');
  }
  return { main, thumb, width: info.width, height: info.height };
}

/**
 * Store a validated original without recompression (e.g. digital deliverables where quality matters).
 * Still content-validated; only allowed in PRIVATE areas.
 */
export async function storeOriginalImage(file: UploadedFile, area: StorageArea, rules: ImageRules = {}) {
  const v = await validateImage(file, rules);
  const ext = v.format === 'jpeg' ? 'jpg' : v.format;
  const stored = await storage.put(area, `${Date.now()}-${nanoid(12)}.${ext}`, file.buffer, `image/${v.format}`);
  return { stored, ...v };
}

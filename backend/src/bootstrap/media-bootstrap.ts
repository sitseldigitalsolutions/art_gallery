import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/env.js';
import { prisma } from '../database/prisma/client.js';
import { logger } from '../utils/logger.js';

/**
 * Columns that store absolute media URLs (`<origin>/media/...`). Fixed list — never user input —
 * so the identifiers are safe to interpolate into SQL; the origin itself is passed as a parameter.
 */
const MEDIA_URL_COLUMNS: Array<[table: string, column: string]> = [
  ['Artist', 'avatarUrl'],
  ['Artist', 'coverImageUrl'],
  ['Artwork', 'previewUrl'],
  ['Artwork', 'thumbnailUrl'],
  ['ArtworkCategory', 'imageUrl'],
  ['ArtworkCollection', 'coverImageUrl'],
  ['ArtworkImage', 'thumbUrl'],
  ['ArtworkImage', 'url'],
  ['ArtworkStyle', 'imageUrl'],
  ['Banner', 'imageUrl'],
  ['Gallery', 'coverImageUrl'],
  ['GalleryImage', 'url'],
  ['OrderItem', 'imageSnapshot'],
  ['ReviewImage', 'url'],
  ['User', 'avatarUrl'],
];

/**
 * Rewrites stored media URLs that point at another origin (e.g. a different host used when the
 * database was exported) so they match this API's public URL. Idempotent; runs on every start.
 */
export async function alignMediaUrls() {
  if (config.STORAGE_PROVIDER !== 'local') return 0;
  const origin = config.API_PUBLIC_URL.replace(/\/$/, '');
  let changed = 0;
  for (const [table, column] of MEDIA_URL_COLUMNS) {
    changed += await prisma.$executeRawUnsafe(
      `UPDATE \`${table}\` SET \`${column}\` = CONCAT(?, SUBSTRING(\`${column}\`, LOCATE('/media/', \`${column}\`)))
       WHERE \`${column}\` LIKE 'http%/media/%' AND \`${column}\` NOT LIKE CONCAT(?, '/media/%')`,
      origin,
      origin,
    );
  }
  if (changed) logger.info(`Aligned ${changed} stored media URLs to ${origin}`);
  return changed;
}

/** Bundled demo images shipped with the code (backend/seed-media/public). */
const SEED_MEDIA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'seed-media', 'public');

/**
 * Copies bundled public images into the upload folder when they are missing there — so a fresh
 * deployment shows the demo catalogue without uploading files by hand. Existing files are never
 * overwritten. Only public images are bundled; private files must be uploaded separately.
 */
export async function restoreSeedMedia() {
  if (config.STORAGE_PROVIDER !== 'local') return 0;
  const target = path.resolve(config.LOCAL_UPLOAD_DIR, 'public');
  let copied = 0;
  const walk = async (dir: string): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const e of entries) {
      const from = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(from);
        continue;
      }
      const to = path.join(target, path.relative(SEED_MEDIA_DIR, from));
      const exists = await fs.stat(to).then(() => true, () => false);
      if (exists) continue;
      await fs.mkdir(path.dirname(to), { recursive: true });
      await fs.copyFile(from, to);
      copied++;
    }
  };
  await walk(SEED_MEDIA_DIR);
  if (copied) logger.info(`Restored ${copied} bundled media files into ${target}`);
  return copied;
}

/** Startup task: never blocks or crashes the API if it fails. */
export async function bootstrapMedia() {
  try {
    await alignMediaUrls();
  } catch (err) {
    logger.error({ err }, 'Could not align media URLs');
  }
  try {
    await restoreSeedMedia();
  } catch (err) {
    logger.error({ err }, 'Could not restore bundled media');
  }
}

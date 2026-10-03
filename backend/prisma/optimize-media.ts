/**
 * Optimise bundled/public images for fast page loads.
 *
 *   npx tsx prisma/optimize-media.ts [dir ...]     (default: seed-media/public and uploads/public)
 *
 * For every main image `<name>.webp` (not already a -thumb / -md variant):
 *   - re-encodes the main file to max 1600px (hero banners in site/ to 1920px) at web quality
 *   - creates `<name>-md.webp` (960px) used by tiles, covers and cards
 *   - creates `<name>-thumb.webp` (640px) if it is missing
 * Idempotent: files already within limits are only re-encoded when that makes them smaller.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const dirs = process.argv.slice(2).length ? process.argv.slice(2) : ['seed-media/public', 'uploads/public'];
const VARIANT = /-(thumb|md)\.webp$/;

async function* walk(dir: string): AsyncGenerator<string> {
  for (const e of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.webp') && !VARIANT.test(e.name)) yield p;
  }
}

async function writeIfSmaller(file: string, data: Buffer) {
  const current = await fs.stat(file).then((s) => s.size, () => Infinity);
  if (data.length < current) {
    await fs.writeFile(file, data);
    return current === Infinity ? data.length : current - data.length;
  }
  return 0;
}

let before = 0;
let after = 0;
let count = 0;
for (const dir of dirs) {
  for await (const file of walk(dir)) {
    const src = await fs.readFile(file);
    before += src.length;
    const isHero = file.split(path.sep).includes('site');
    const max = isHero ? 1920 : 1600;
    const main = await sharp(src).resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true }).webp({ quality: isHero ? 74 : 78, effort: 5 }).toBuffer();
    await writeIfSmaller(file, main);
    const base = file.slice(0, -'.webp'.length);
    const md = await sharp(main).resize({ width: 960, height: 960, fit: 'inside', withoutEnlargement: true }).webp({ quality: 74, effort: 5 }).toBuffer();
    await fs.writeFile(`${base}-md.webp`, md);
    const thumbPath = `${base}-thumb.webp`;
    if (!(await fs.stat(thumbPath).catch(() => null))) {
      await fs.writeFile(thumbPath, await sharp(main).resize({ width: 640, height: 640, fit: 'inside' }).webp({ quality: 76 }).toBuffer());
    }
    after += Math.min(main.length, src.length);
    count++;
  }
}
console.log(`Optimised ${count} images: main files ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB (+ medium variants)`);

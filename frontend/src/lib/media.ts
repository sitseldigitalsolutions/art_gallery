/**
 * Uploaded images are stored as `<name>.webp` (full) plus `<name>-md.webp` (960px) and
 * `<name>-thumb.webp` (640px). Pick the smallest variant that looks sharp for where it is shown.
 */
export type MediaSize = 'thumb' | 'md' | 'full';

const MEDIA_FILE = /^(.*\/media\/.+?)(-thumb|-md)?\.webp(\?.*)?$/;

export function mediaVariant(url: string | null | undefined, size: MediaSize): string | null | undefined {
  if (!url) return url;
  const m = url.match(MEDIA_FILE);
  if (!m) return url; // not one of our media files (e.g. blob: preview, external URL)
  const [, base, , query = ''] = m;
  return size === 'full' ? `${base}.webp${query}` : `${base}-${size}.webp${query}`;
}

/** True when the URL already points at a reduced variant. */
export const isVariant = (url: string | null | undefined) => !!url && /-(thumb|md)\.webp(\?.*)?$/.test(url);

export const PHOTO_MAX_BYTES = 15 * 1024 * 1024;
export const PHOTO_MAX_COUNT = 5;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Client-side pre-check. The server re-validates content (magic bytes, dimensions) regardless. */
export function validatePhoto(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return `“${file.name}” is not a JPEG, PNG or WebP image.`;
  if (file.size > PHOTO_MAX_BYTES) return `“${file.name}” is larger than 15 MB.`;
  if (file.size === 0) return `“${file.name}” is empty.`;
  return null;
}

export function addPhotos(current: File[], incoming: File[]): { files: File[]; errors: string[] } {
  const errors: string[] = [];
  const files = [...current];
  for (const f of incoming) {
    const err = validatePhoto(f);
    if (err) {
      errors.push(err);
      continue;
    }
    if (files.length >= PHOTO_MAX_COUNT) {
      errors.push(`You can upload up to ${PHOTO_MAX_COUNT} photos.`);
      break;
    }
    files.push(f);
  }
  return { files, errors };
}

export const CUSTOM_OPTIONS = [
  { key: 'background', label: 'Background', placeholder: 'e.g. temple at sunset, plain cream, starry night' },
  { key: 'clothing', label: 'Clothing', placeholder: 'e.g. traditional silk saree, keep as in photo' },
  { key: 'colors', label: 'Colour preferences', placeholder: 'e.g. warm golds and deep reds' },
  { key: 'text', label: 'Text to add', placeholder: 'e.g. “Happy 25th Anniversary, Amma & Appa”' },
  { key: 'pose', label: 'Pose changes', placeholder: 'e.g. keep the same pose' },
  { key: 'effects', label: 'Artistic effects', placeholder: 'e.g. gold leaf accents, soft brush strokes' },
  { key: 'lighting', label: 'Lighting', placeholder: 'e.g. soft morning light' },
  { key: 'theme', label: 'Theme / occasion', placeholder: 'e.g. Diwali, wedding, birthday' },
] as const;

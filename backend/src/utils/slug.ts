import { customAlphabet } from 'nanoid';

const suffix = customAlphabet('abcdefghijkmnpqrstuvwxyz23456789', 6);
const code = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

export const slugify = (input: string) =>
  input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';

export const uniqueSlug = (input: string) => `${slugify(input)}-${suffix()}`;
export const referenceCode = (prefix: string) => `${prefix}-${code()}`;

const formatters = new Map<string, Intl.NumberFormat>();

export function money(value: number | null | undefined, currency = 'INR') {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 });
    formatters.set(currency, f);
  }
  return f.format(value);
}

export function compact(n: number | null | undefined) {
  if (!n) return '0';
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function date(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', opts).format(new Date(value));
}

export function dateTime(value: string | Date | null | undefined) {
  return date(value, { dateStyle: 'medium', timeStyle: 'short' });
}

export function humanize(value: string | null | undefined) {
  if (!value) return '';
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/** "1 artwork", "5 artworks" */
export const plural = (n: number, word: string) => `${n.toLocaleString('en-IN')} ${word}${n === 1 ? '' : 's'}`;

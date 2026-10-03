import { Tag } from 'antd';
import { humanize } from '@/lib/format';
import { STATUS_COLORS } from '@/features/seller/SellerLayout';

/** Safe nested accessor for loosely-typed admin rows: g(row, 'artist.displayName', 'artistName'). */
export function g(row: unknown, ...paths: string[]): unknown {
  for (const p of paths) {
    let cur: unknown = row;
    for (const k of p.split('.')) {
      if (cur && typeof cur === 'object' && k in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[k];
      else {
        cur = undefined;
        break;
      }
    }
    if (cur !== undefined && cur !== null) return cur;
  }
  return undefined;
}

export const s = (row: unknown, ...paths: string[]) => {
  const v = g(row, ...paths);
  return v === undefined ? '—' : String(v);
};

export const num = (row: unknown, ...paths: string[]) => Number(g(row, ...paths) ?? 0);

export function StatusTag({ value }: { value: unknown }) {
  if (!value) return <>—</>;
  const v = String(value);
  return <Tag color={STATUS_COLORS[v] ?? 'default'}>{humanize(v)}</Tag>;
}

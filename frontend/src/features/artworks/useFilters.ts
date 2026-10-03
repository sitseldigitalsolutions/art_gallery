import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ArtworkFilters } from './api';

export const FILTER_KEYS = [
  'q',
  'category',
  'style',
  'medium',
  'theme',
  'artist',
  'gallery',
  'color',
  'minPrice',
  'maxPrice',
  'orientation',
  'format',
  'type',
  'size',
  'customizable',
  'featured',
  'sort',
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];

/** Gallery filters live in the URL so results are shareable and survive reloads. */
export function useGalleryFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(() => {
    const f: ArtworkFilters = {};
    for (const k of FILTER_KEYS) {
      const v = params.get(k);
      if (v) (f as Record<string, string>)[k] = v;
    }
    return f;
  }, [params]);

  const setFilter = useCallback(
    (key: FilterKey, value: string | null | undefined) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setMany = useCallback(
    (values: Partial<Record<FilterKey, string | null>>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(values)) {
            if (v) next.set(k, v);
            else next.delete(k);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const clear = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);

  const activeCount = FILTER_KEYS.filter((k) => k !== 'sort' && k !== 'q' && params.get(k)).length;

  return { filters, setFilter, setMany, clear, activeCount };
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import type { WishlistItemType } from '@/lib/types';
import { wishlistApi, type WishlistIds } from './api';

const EMPTY: WishlistIds = { ARTWORK: [], ARTIST: [], GALLERY: [], COLLECTION: [] };

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const ids = useQuery({ queryKey: ['wishlist', 'ids'], queryFn: wishlistApi.ids, enabled: !!user });

  const toggle = useMutation({
    mutationFn: async ({ type, id, saved }: { type: WishlistItemType; id: string; saved: boolean }) =>
      saved ? wishlistApi.remove(type, id) : wishlistApi.add(type, id),
    onMutate: async ({ type, id, saved }) => {
      await qc.cancelQueries({ queryKey: ['wishlist', 'ids'] });
      const prev = qc.getQueryData<WishlistIds>(['wishlist', 'ids']);
      const base = prev ?? EMPTY;
      qc.setQueryData<WishlistIds>(['wishlist', 'ids'], {
        ...base,
        [type]: saved ? base[type].filter((x) => x !== id) : [...base[type], id],
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['wishlist', 'ids'], ctx.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const data = ids.data ?? EMPTY;
  return {
    isSaved: (type: WishlistItemType, id: string) => (data[type] ?? []).includes(id),
    toggle: (type: WishlistItemType, id: string) => {
      if (!user) {
        navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
        return;
      }
      toggle.mutate({ type, id, saved: (data[type] ?? []).includes(id) });
    },
  };
}

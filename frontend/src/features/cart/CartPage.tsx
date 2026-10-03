import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Sparkles, Trash2 } from 'lucide-react';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { NavSpacer } from '@/layouts/MainLayout';
import { errorMessage } from '@/lib/api';
import { humanize, money } from '@/lib/format';
import { cartApi } from './api';

export default function CartPage() {
  const qc = useQueryClient();
  const cart = useQuery({ queryKey: ['cart'], queryFn: cartApi.get });
  const update = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => (qty <= 0 ? cartApi.remove(id) : cartApi.update(id, qty)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
  const c = cart.data;

  return (
    <>
      <NavSpacer />
      <div className="container-x py-12">
        <h1 className="mb-8 font-serif text-4xl">Your cart</h1>
        {cart.isLoading && <Skeleton className="h-64" />}
        {cart.isError && <ErrorState message={errorMessage(cart.error)} onRetry={() => cart.refetch()} />}
        {c && c.items.length === 0 && (
          <EmptyState
            title="Your cart is empty"
            message="Find something that speaks to you in the gallery."
            action={
              <Link to="/gallery" className="btn-brand">
                Explore Gallery
              </Link>
            }
          />
        )}
        {c && c.items.length > 0 && (
          <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
            <ul className="space-y-4">
              <AnimatePresence>
                {c.items.map((item) => {
                  const art = item.artwork;
                  const custom = item.customArt;
                  const img = art?.thumbnailUrl ?? custom?.previewUrl ?? null;
                  return (
                    <motion.li key={item.id} layout exit={{ opacity: 0, x: -40 }} className="card flex gap-4 p-4">
                      <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">{img && <img src={img} alt="" className="h-full w-full object-cover" />}</div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        {art ? (
                          <Link to={`/artworks/${art.slug}`} className="font-semibold hover:text-brand">
                            {art.title}
                          </Link>
                        ) : (
                          <Link to={`/account/custom-art/${custom?.id}`} className="flex items-center gap-1 font-semibold hover:text-brand">
                            <Sparkles size={14} className="text-brand" /> {custom?.title ?? 'Custom artwork'} ({custom?.requestNumber})
                          </Link>
                        )}
                        <p className="text-xs text-gray-500">
                          {art ? `${art.artist.displayName} · ${humanize(art.format)}` : `Custom commission · ${custom?.artist.displayName}`}
                        </p>
                        {!item.available && <p className="mt-1 text-xs font-semibold text-red-600">No longer available — please remove it.</p>}
                        <div className="mt-auto flex items-center justify-between pt-3">
                          {art && art.format !== 'ORIGINAL' && art.format !== 'DIGITAL' ? (
                            <div className="flex items-center gap-2 rounded-full border border-gray-200 px-2">
                              <button aria-label="Decrease quantity" onClick={() => update.mutate({ id: item.id, qty: item.quantity - 1 })}>
                                <Minus size={14} />
                              </button>
                              <span className="w-6 text-center text-sm">{item.quantity}</span>
                              <button aria-label="Increase quantity" onClick={() => update.mutate({ id: item.id, qty: item.quantity + 1 })}>
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Qty 1</span>
                          )}
                          <div className="flex items-center gap-4">
                            <span className="font-semibold">{money(item.lineTotal, c.currency)}</span>
                            <button aria-label="Remove item" className="text-gray-400 hover:text-red-600" onClick={() => update.mutate({ id: item.id, qty: 0 })}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
            <aside className="card h-fit space-y-3 p-6 lg:sticky lg:top-24">
              <h2 className="font-semibold">Order summary</h2>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal ({c.itemCount} items)</span>
                <span>{money(c.subtotal, c.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span>{c.requiresShipping ? (c.shippingFee ? money(c.shippingFee, c.currency) : 'Free') : 'Digital delivery'}</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{money(c.total, c.currency)}</span>
              </div>
              {update.isError && <p className="text-xs text-red-600">{errorMessage(update.error)}</p>}
              <Link to="/checkout" className={`btn-brand w-full !py-3 ${c.items.some((i) => !i.available) ? 'pointer-events-none opacity-50' : ''}`}>
                <ShoppingBag size={16} /> Proceed to checkout
              </Link>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

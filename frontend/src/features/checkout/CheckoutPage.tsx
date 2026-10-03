import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { CheckCircle2, Lock } from 'lucide-react';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { accountApi } from '@/features/account/api';
import { cartApi, ordersApi } from '@/features/cart/api';
import { NavSpacer } from '@/layouts/MainLayout';
import { errorMessage } from '@/lib/api';
import { money } from '@/lib/format';

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the recipient name'),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{7,15}$/, 'Enter a valid phone number'),
  line1: z.string().trim().min(3, 'Enter the address'),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, 'Enter the city'),
  state: z.string().trim().min(2, 'Enter the state'),
  postalCode: z.string().trim().regex(/^[A-Za-z0-9 -]{4,10}$/, 'Enter a valid PIN / postal code'),
  country: z.string().trim().min(2),
});
type AddressForm = z.infer<typeof addressSchema>;

export default function CheckoutPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const cart = useQuery({ queryKey: ['cart'], queryFn: cartApi.get });
  const methods = useQuery({ queryKey: ['payment-methods'], queryFn: ordersApi.paymentMethods });
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: accountApi.addresses });
  const [addressId, setAddressId] = useState<string>('new');
  const [method, setMethod] = useState<'COD' | 'MANUAL' | ''>('');
  const [notes, setNotes] = useState('');
  const form = useForm<AddressForm>({ resolver: zodResolver(addressSchema), defaultValues: { country: 'IN' } });

  const c = cart.data;
  const needsAddress = !!c?.requiresShipping;
  const savedAddresses = addresses.data ?? [];
  const effectiveAddressId = addressId === 'new' && savedAddresses.length && !form.formState.isDirty ? savedAddresses.find((a) => a.isDefault)?.id ?? 'new' : addressId;
  const availableMethods = methods.data?.filter((m) => m.available) ?? [];
  const chosen = method || availableMethods[0]?.method || '';

  const place = useMutation({
    mutationFn: async () => {
      let shippingAddress: AddressForm | undefined;
      if (needsAddress && effectiveAddressId === 'new') {
        const ok = await form.trigger();
        if (!ok) throw new Error('Please complete the shipping address');
        shippingAddress = form.getValues();
      }
      return ordersApi.checkout({
        paymentMethod: chosen as 'COD' | 'MANUAL',
        addressId: needsAddress && effectiveAddressId !== 'new' ? effectiveAddressId : undefined,
        shippingAddress,
        notes: notes || undefined,
      });
    },
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/account/orders/${order.id}?placed=1`);
    },
  });

  if (cart.isLoading)
    return (
      <>
        <NavSpacer />
        <div className="container-x py-12">
          <Skeleton className="h-96" />
        </div>
      </>
    );
  if (cart.isError)
    return (
      <>
        <NavSpacer />
        <div className="container-x py-12">
          <ErrorState message={errorMessage(cart.error)} />
        </div>
      </>
    );
  if (!c || c.items.length === 0)
    return (
      <>
        <NavSpacer />
        <div className="container-x py-12">
          <EmptyState title="Nothing to check out" action={<Link to="/gallery" className="btn-brand">Explore Gallery</Link>} />
        </div>
      </>
    );

  const err = form.formState.errors;
  const field = (name: keyof AddressForm, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label className="label" htmlFor={`addr-${name}`}>
        {label}
      </label>
      <input id={`addr-${name}`} className={clsx('input', err[name] && '!border-red-400')} {...form.register(name)} {...props} />
      {err[name] && <p className="mt-1 text-xs text-red-600">{err[name]?.message}</p>}
    </div>
  );

  return (
    <>
      <NavSpacer />
      <div className="container-x py-12">
        <h1 className="mb-8 font-serif text-4xl">Checkout</h1>
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            {needsAddress ? (
              <section className="card p-6">
                <h2 className="mb-4 font-semibold">Shipping address</h2>
                {savedAddresses.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {savedAddresses.map((a) => (
                      <label key={a.id} className={clsx('flex cursor-pointer gap-3 rounded-2xl border p-4 text-sm', effectiveAddressId === a.id ? 'border-brand bg-brand-light/40' : 'border-gray-200')}>
                        <input type="radio" name="address" className="mt-1 accent-brand" checked={effectiveAddressId === a.id} onChange={() => setAddressId(a.id!)} />
                        <span>
                          <span className="font-semibold">{a.fullName}</span> · {a.phone}
                          <br />
                          {a.line1}
                          {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.postalCode}
                        </span>
                      </label>
                    ))}
                    <label className={clsx('flex cursor-pointer gap-3 rounded-2xl border p-4 text-sm', effectiveAddressId === 'new' ? 'border-brand' : 'border-gray-200')}>
                      <input type="radio" name="address" className="accent-brand" checked={effectiveAddressId === 'new'} onChange={() => setAddressId('new')} />
                      Use a new address
                    </label>
                  </div>
                )}
                {effectiveAddressId === 'new' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field('fullName', 'Full name', { autoComplete: 'name' })}
                    {field('phone', 'Phone', { autoComplete: 'tel' })}
                    <div className="sm:col-span-2">{field('line1', 'Address line 1', { autoComplete: 'address-line1' })}</div>
                    <div className="sm:col-span-2">{field('line2', 'Address line 2 (optional)', { autoComplete: 'address-line2' })}</div>
                    {field('city', 'City')}
                    {field('state', 'State')}
                    {field('postalCode', 'PIN code', { autoComplete: 'postal-code' })}
                    {field('country', 'Country')}
                  </div>
                )}
              </section>
            ) : (
              <section className="card flex gap-3 p-6 text-sm">
                <CheckCircle2 className="shrink-0 text-emerald-600" />
                Everything in your cart is digital — no shipping address needed. Downloads unlock in your order once payment is confirmed.
              </section>
            )}

            <section className="card p-6">
              <h2 className="mb-4 font-semibold">Payment</h2>
              {methods.isLoading && <Skeleton className="h-24" />}
              <div className="space-y-3">
                {methods.data?.map((m) => (
                  <label
                    key={m.method}
                    className={clsx(
                      'flex gap-3 rounded-2xl border p-4 text-sm',
                      !m.available ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                      chosen === m.method && m.available ? 'border-brand bg-brand-light/40' : 'border-gray-200',
                    )}
                  >
                    <input type="radio" name="method" className="mt-1 accent-brand" disabled={!m.available} checked={chosen === m.method} onChange={() => setMethod(m.method)} />
                    <span>
                      <span className="font-semibold">{m.label}</span>
                      <br />
                      <span className="text-gray-500">{m.available ? m.description : m.reason}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <Lock size={13} /> Online card/UPI gateways are coming soon. We never ask for card details on this page.
              </p>
            </section>

            <section className="card p-6">
              <label className="label" htmlFor="notes">
                Notes for the artist (optional)
              </label>
              <textarea id="notes" className="input" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gift wrap, delivery timing…" />
            </section>
          </div>

          <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
            <h2 className="font-semibold">Your order</h2>
            <ul className="space-y-3">
              {c.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 text-sm">
                  <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {(i.artwork?.thumbnailUrl ?? i.customArt?.previewUrl) && <img src={i.artwork?.thumbnailUrl ?? i.customArt?.previewUrl ?? ''} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <span className="min-w-0 flex-1 truncate">
                    {i.artwork?.title ?? i.customArt?.title ?? 'Custom artwork'} {i.quantity > 1 && `× ${i.quantity}`}
                  </span>
                  <span>{money(i.lineTotal, c.currency)}</span>
                </li>
              ))}
            </ul>
            <hr className="border-gray-100" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{money(c.subtotal, c.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping</span>
              <span>{c.shippingFee ? money(c.shippingFee, c.currency) : c.requiresShipping ? 'Free' : '—'}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{money(c.total, c.currency)}</span>
            </div>
            {place.isError && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{errorMessage(place.error)}</p>}
            <button className="btn-brand w-full !py-3" disabled={!chosen || place.isPending} onClick={() => place.mutate()}>
              {place.isPending ? 'Placing order…' : 'Place order'}
            </button>
          </aside>
        </div>
      </div>
    </>
  );
}

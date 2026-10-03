import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { NavLink, Outlet, useSearchParams } from 'react-router-dom';
import { Bell, Heart, MapPin, Package, Sparkles, Trash2, User } from 'lucide-react';
import { ArtistPortrait, Avatar } from '@/components/cards';
import { EmptyState, Skeleton } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { artistsApi } from '@/features/artists/api';
import { addressSchema } from '@/features/checkout/CheckoutPage';
import { NavSpacer } from '@/layouts/MainLayout';
import { errorMessage } from '@/lib/api';
import { dateTime } from '@/lib/format';
import type { Address } from '@/lib/types';
import { authApi } from '@/features/auth/api';
import { accountApi, notificationsApi } from './api';
import type { z } from 'zod';

export function AccountLayout() {
  const links = [
    { to: '/account', label: 'Profile', icon: User, end: true },
    { to: '/account/orders', label: 'Orders', icon: Package },
    { to: '/account/custom-art', label: 'Custom art', icon: Sparkles },
    { to: '/wishlist', label: 'Wishlist', icon: Heart },
  ];
  return (
    <>
      <NavSpacer />
      <div className="container-x grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Account" className="flex gap-2 overflow-x-auto lg:flex-col">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => clsx('flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium', isActive ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-50')}
            >
              <l.icon size={16} /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </>
  );
}

function Profile() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: accountApi.me });
  const [fullName, setFullName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () => accountApi.update({ fullName: fullName ?? me.data?.fullName, phone: phone ?? me.data?.phone ?? undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
  const avatar = useMutation({ mutationFn: accountApi.uploadAvatar, onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }) });
  const [pw, setPw] = useState({ current: '', next: '' });
  const changePw = useMutation({ mutationFn: () => authApi.changePassword(pw.current, pw.next), onSuccess: () => setPw({ current: '', next: '' }) });

  if (me.isLoading) return <Skeleton className="h-60" />;
  const m = me.data;
  if (!m) return null;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card space-y-4 p-6">
        <div className="flex items-center gap-4">
          <Avatar src={m.avatarUrl} name={m.fullName} size={64} />
          <label className="btn-outline cursor-pointer !py-2 text-xs">
            Change photo
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && avatar.mutate(e.target.files[0])} />
          </label>
        </div>
        {avatar.isError && <p className="text-xs text-red-600">{errorMessage(avatar.error)}</p>}
        <div>
          <label className="label" htmlFor="p-name">
            Full name
          </label>
          <input id="p-name" className="input" value={fullName ?? m.fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="p-phone">
            Phone
          </label>
          <input id="p-phone" className="input" value={phone ?? m.phone ?? ''} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <p className="text-xs text-gray-500">Email: {m.email}</p>
        {save.isError && <p className="text-xs text-red-600">{errorMessage(save.error)}</p>}
        {save.isSuccess && <p className="text-xs text-emerald-600">Saved.</p>}
        <button className="btn-brand" disabled={save.isPending} onClick={() => save.mutate()}>
          Save profile
        </button>
      </section>
      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Change password</h2>
        <input type="password" className="input" placeholder="Current password" aria-label="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
        <input type="password" className="input" placeholder="New password" aria-label="New password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        <p className="text-xs text-gray-500">At least 8 characters with upper & lower case letters and a number. You’ll be signed out of other devices.</p>
        {changePw.isError && <p className="text-xs text-red-600">{errorMessage(changePw.error)}</p>}
        {changePw.isSuccess && <p className="text-xs text-emerald-600">Password changed.</p>}
        <button className="btn-outline" disabled={!pw.current || !pw.next || changePw.isPending} onClick={() => changePw.mutate()}>
          Update password
        </button>
      </section>
    </div>
  );
}

function Addresses() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['addresses'], queryFn: accountApi.addresses });
  const form = useForm<z.infer<typeof addressSchema>>({ resolver: zodResolver(addressSchema), defaultValues: { country: 'IN' } });
  const add = useMutation({
    mutationFn: (a: Address) => accountApi.addAddress(a),
    onSuccess: () => {
      form.reset({ country: 'IN' });
      qc.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
  const remove = useMutation({ mutationFn: accountApi.removeAddress, onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }) });
  const makeDefault = useMutation({ mutationFn: (id: string) => accountApi.updateAddress(id, { isDefault: true }), onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }) });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        {list.data?.length === 0 && <p className="text-sm text-gray-500">No saved addresses yet.</p>}
        {list.data?.map((a) => (
          <div key={a.id} className="card flex gap-3 p-4 text-sm">
            <MapPin size={16} className="mt-0.5 shrink-0 text-brand" />
            <div className="flex-1">
              <p className="font-semibold">
                {a.fullName} {a.isDefault && <span className="ml-1 rounded-full bg-brand-light px-2 py-0.5 text-[10px] text-brand">Default</span>}
              </p>
              <p className="text-gray-500">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.postalCode} · {a.phone}
              </p>
              {!a.isDefault && (
                <button className="mt-1 text-xs font-semibold text-brand" onClick={() => makeDefault.mutate(a.id!)}>
                  Make default
                </button>
              )}
            </div>
            <button aria-label="Delete address" className="text-gray-400 hover:text-red-600" onClick={() => remove.mutate(a.id!)}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <form className="card grid gap-3 p-6 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => add.mutate(v))}>
        <h2 className="font-semibold sm:col-span-2">Add an address</h2>
        {(['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'] as const).map((k) => (
          <div key={k} className={k.startsWith('line') ? 'sm:col-span-2' : ''}>
            <input className="input" placeholder={k === 'line1' ? 'Address line 1' : k === 'line2' ? 'Address line 2 (optional)' : k === 'postalCode' ? 'PIN code' : k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1')} aria-label={k} {...form.register(k)} />
            {form.formState.errors[k] && <p className="mt-1 text-xs text-red-600">{form.formState.errors[k]?.message}</p>}
          </div>
        ))}
        {add.isError && <p className="text-xs text-red-600 sm:col-span-2">{errorMessage(add.error)}</p>}
        <button className="btn-brand sm:col-span-2" disabled={add.isPending}>
          Save address
        </button>
      </form>
    </div>
  );
}

function Following() {
  const q = useQuery({ queryKey: ['follows'], queryFn: artistsApi.following });
  if (q.isLoading) return <Skeleton className="h-40" />;
  if (!q.data?.length) return <EmptyState title="You’re not following any artists yet" message="Follow artists to hear about their new work first." />;
  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
      {q.data.map((a) => (
        <ArtistPortrait key={a.id} artist={a} />
      ))}
    </div>
  );
}

function Notifications() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list() });
  const readAll = useMutation({ mutationFn: notificationsApi.readAll, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  const read = useMutation({ mutationFn: notificationsApi.read, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className="text-xs font-semibold text-brand" onClick={() => readAll.mutate()}>
          Mark all as read
        </button>
      </div>
      {q.data?.data.length === 0 && <EmptyState title="No notifications" />}
      <ul className="space-y-2">
        {q.data?.data.map((n) => (
          <li key={n.id} className={clsx('card flex gap-3 p-4 text-sm', !n.readAt && 'border-brand/30 bg-brand-light/30')}>
            <Bell size={16} className="mt-0.5 shrink-0 text-brand" />
            <div className="flex-1">
              <p className="font-semibold">{n.title}</p>
              {n.body && <p className="text-gray-600">{n.body}</p>}
              <p className="mt-1 text-xs text-gray-400">{dateTime(n.createdAt)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {n.link && (
                <a href={n.link} className="text-xs font-semibold text-brand" onClick={() => !n.readAt && read.mutate(n.id)}>
                  View
                </a>
              )}
              {!n.readAt && (
                <button className="text-xs text-gray-400" onClick={() => read.mutate(n.id)}>
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AccountHome() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'profile';
  const tabs = [
    ['profile', 'Profile'],
    ['addresses', 'Addresses'],
    ['following', 'Following'],
    ['notifications', 'Notifications'],
  ];
  return (
    <div>
      <h1 className="text-2xl font-semibold">Hello, {user?.fullName.split(' ')[0]}</h1>
      <div role="tablist" className="my-6 flex gap-2 overflow-x-auto">
        {tabs.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={clsx('chip', tab === k && 'chip-active')} onClick={() => setParams({ tab: k })}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'profile' && <Profile />}
      {tab === 'addresses' && <Addresses />}
      {tab === 'following' && <Following />}
      {tab === 'notifications' && <Notifications />}
    </div>
  );
}

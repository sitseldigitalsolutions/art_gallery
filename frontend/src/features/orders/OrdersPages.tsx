import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Download, Package, Truck } from 'lucide-react';
import { EmptyState, ErrorState, Pagination, Skeleton, StatusPill } from '@/components/ui';
import { ordersApi } from '@/features/cart/api';
import { errorMessage } from '@/lib/api';
import { date, dateTime, humanize, money } from '@/lib/format';

export function OrdersList() {
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['orders', page], queryFn: () => ordersApi.list(page) });
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">My orders</h1>
      {q.isLoading && <Skeleton className="h-40" />}
      {q.isError && <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />}
      {q.data?.data.length === 0 && <EmptyState title="No orders yet" action={<Link to="/gallery" className="btn-brand">Explore Gallery</Link>} />}
      <div className="space-y-3">
        {q.data?.data.map((o) => (
          <Link key={o.id} to={`/account/orders/${o.id}`} className="card flex items-center gap-4 p-4 transition hover:shadow-md">
            <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">{o.previewImage && <img src={o.previewImage} alt="" className="h-full w-full object-cover" />}</div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{o.orderNumber}</p>
              <p className="text-xs text-gray-500">
                {date(o.placedAt)} · {o.itemCount} item{o.itemCount === 1 ? '' : 's'} · {humanize(o.paymentMethod)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-semibold">{money(o.total, o.currency)}</span>
              <StatusPill status={o.status} />
            </div>
          </Link>
        ))}
      </div>
      {q.data && <Pagination page={page} totalPages={q.data.meta.totalPages} onChange={setPage} />}
    </div>
  );
}

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['order', id], queryFn: () => ordersApi.detail(id) });
  const cancel = useMutation({ mutationFn: () => ordersApi.cancel(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }) });
  const download = useMutation({
    mutationFn: (accessId: string) => ordersApi.downloadLink(accessId),
    onSuccess: (res) => {
      window.location.href = res.url;
      qc.invalidateQueries({ queryKey: ['order', id] });
    },
  });

  if (q.isLoading) return <Skeleton className="h-96" />;
  if (q.isError || !q.data) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const o = q.data;

  return (
    <div className="space-y-8">
      {params.get('placed') && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 rounded-3xl bg-emerald-50 p-5 text-emerald-800">
          <CheckCircle2 className="shrink-0" />
          <div>
            <p className="font-semibold">Thank you — your order is placed!</p>
            <p className="text-sm">
              {o.paymentMethod === 'COD'
                ? 'Pay in cash when your artwork arrives.'
                : 'Our team will share payment instructions and confirm your payment manually. Digital downloads unlock once it is confirmed.'}
            </p>
          </div>
        </motion.div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Order {o.orderNumber}</h1>
          <p className="text-sm text-gray-500">Placed {dateTime(o.placedAt)}</p>
        </div>
        <div className="flex gap-2">
          <StatusPill status={o.status} />
          <StatusPill status={`PAYMENT ${o.paymentStatus}`} />
        </div>
      </div>

      <section className="card divide-y divide-gray-100">
        {o.items.map((i) => (
          <div key={i.id} className="flex gap-4 p-4">
            <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">{i.imageSnapshot && <img src={i.imageSnapshot} alt="" className="h-full w-full object-cover" />}</div>
            <div className="min-w-0 flex-1">
              {i.artworkSlug ? (
                <Link to={`/artworks/${i.artworkSlug}`} className="font-semibold hover:text-brand">
                  {i.titleSnapshot}
                </Link>
              ) : (
                <p className="font-semibold">{i.titleSnapshot}</p>
              )}
              <p className="text-xs text-gray-500">
                {i.artist.displayName} · {humanize(i.format)} · Qty {i.quantity}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusPill status={i.fulfillmentStatus} />
                {i.canReview && i.artworkSlug && (
                  <Link to={`/artworks/${i.artworkSlug}#reviews-title`} className="text-xs font-semibold text-brand hover:underline">
                    Write a review
                  </Link>
                )}
              </div>
            </div>
            <span className="font-semibold">{money(i.lineTotal, o.currency)}</span>
          </div>
        ))}
        <div className="space-y-1 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{money(o.subtotal, o.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Shipping</span>
            <span>{money(o.shippingFee, o.currency)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{money(o.total, o.currency)}</span>
          </div>
        </div>
      </section>

      {o.payments.some((p) => p.instructions && p.status !== 'PAID') && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <h2 className="mb-2 font-semibold">How to pay</h2>
          {o.payments
            .filter((p) => p.instructions && p.status !== 'PAID')
            .map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p.instructions}
                {p.providerRef && <span className="mt-1 block text-xs">Reference: {p.providerRef}</span>}
              </p>
            ))}
        </section>
      )}

      {o.downloads.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Digital downloads</h2>
          <ul className="space-y-3">
            {o.downloads.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-4 text-sm">
                <span>
                  {d.title}
                  <span className="block text-xs text-gray-400">
                    {d.remaining} downloads left{d.expiresAt ? ` · expires ${date(d.expiresAt)}` : ''}
                  </span>
                </span>
                <button className="btn-brand !py-2" disabled={d.remaining <= 0 || download.isPending} onClick={() => download.mutate(d.id)}>
                  <Download size={15} /> Download
                </button>
              </li>
            ))}
          </ul>
          {download.isError && <p className="mt-2 text-xs text-red-600">{errorMessage(download.error)}</p>}
        </section>
      )}

      {o.shipments.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Shipments</h2>
          <ul className="space-y-4">
            {o.shipments.map((s, idx) => (
              <li key={idx} className="flex gap-3 text-sm">
                {s.status === 'DELIVERED' ? <Package className="text-emerald-600" /> : <Truck className="text-brand" />}
                <div>
                  <p className="font-semibold">
                    From {s.artist.displayName} · {humanize(s.status)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {s.carrier ?? 'Carrier pending'}
                    {s.trackingNumber && ` · Tracking ${s.trackingNumber}`}
                    {s.shippedAt && ` · shipped ${date(s.shippedAt)}`}
                    {s.deliveredAt && ` · delivered ${date(s.deliveredAt)}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {o.shippingAddress && (
        <section className="text-sm">
          <h2 className="mb-2 font-semibold">Shipping to</h2>
          <p className="text-gray-600">
            {o.shippingAddress.fullName} · {o.shippingAddress.phone}
            <br />
            {o.shippingAddress.line1}
            {o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ''}, {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postalCode}
          </p>
        </section>
      )}

      {['PENDING', 'CONFIRMED'].includes(o.status) && o.paymentStatus !== 'PAID' && (
        <button className="text-sm text-red-600 hover:underline" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
          Cancel this order
        </button>
      )}
      {cancel.isError && <p className="text-xs text-red-600">{errorMessage(cancel.error)}</p>}
    </div>
  );
}

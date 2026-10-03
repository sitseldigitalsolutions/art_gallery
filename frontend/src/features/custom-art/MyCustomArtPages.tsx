import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Download, MessageSquare, RotateCcw, ShoppingBag, Sparkles, X } from 'lucide-react';
import { Avatar } from '@/components/cards';
import { EmptyState, ErrorState, Skeleton, StatusPill } from '@/components/ui';
import { cartApi } from '@/features/cart/api';
import { errorMessage } from '@/lib/api';
import { date, dateTime, humanize, money } from '@/lib/format';
import type { CustomArtDetail, CustomArtStatus } from '@/lib/types';
import { customArtApi } from './api';

const FLOW: CustomArtStatus[] = ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'PREVIEW_READY', 'CUSTOMER_APPROVED', 'FINALIZING', 'COMPLETED'];

export function MyCustomArtList() {
  const q = useQuery({ queryKey: ['custom-art', 'mine'], queryFn: () => customArtApi.list({ as: 'customer' }) });
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My custom art</h1>
        <Link to="/create-your-art" className="btn-brand">
          <Sparkles size={16} /> New request
        </Link>
      </div>
      {q.isLoading && <Skeleton className="h-40" />}
      {q.isError && <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />}
      {q.data?.data.length === 0 && (
        <EmptyState
          title="No custom art requests yet"
          message="Upload a photo and let an artist turn it into a painting."
          action={
            <Link to="/create-your-art" className="btn-brand">
              Create Your Art
            </Link>
          }
        />
      )}
      <div className="space-y-4">
        {q.data?.data.map((r) => (
          <Link key={r.id} to={`/account/custom-art/${r.id}`} className="card flex items-center gap-4 p-4 transition hover:shadow-md">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
              {(r.latestPreviewUrl ?? r.sourceThumbUrl) && <img src={r.latestPreviewUrl ?? r.sourceThumbUrl ?? ''} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{r.title ?? r.style?.name ?? 'Custom artwork'}</p>
                <StatusPill status={r.status} />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {r.requestNumber} · {r.artist.displayName} · {date(r.createdAt)}
              </p>
            </div>
            <div className="text-right text-sm">
              {r.quotedPrice ? <p className="font-semibold">{money(r.quotedPrice, r.currency)}</p> : <p className="text-gray-400">Awaiting quote</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Timeline({ request }: { request: CustomArtDetail }) {
  const reached = new Set(request.statusHistory.map((h) => h.toStatus));
  reached.add(request.status);
  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {FLOW.map((s, i) => {
        const done = reached.has(s) || FLOW.indexOf(request.status) > i;
        return (
          <li key={s} className="flex items-center">
            <span className={clsx('flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold', done ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400')}>
              {done && <Check size={11} />} {humanize(s)}
            </span>
            {i < FLOW.length - 1 && <span className={clsx('mx-1 h-0.5 w-4', done ? 'bg-brand' : 'bg-gray-200')} />}
          </li>
        );
      })}
    </ol>
  );
}

export function MyCustomArtDetail() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ['custom-art', id], queryFn: () => customArtApi.detail(id) });
  const [feedback, setFeedback] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ['custom-art'] });

  const act = useMutation({
    mutationFn: async (action: 'approve' | 'revision' | 'complete' | 'cancel' | 'addToCart') => {
      if (action === 'approve') return customArtApi.approve(id);
      if (action === 'revision') return customArtApi.revision(id, feedback);
      if (action === 'complete') return customArtApi.complete(id);
      if (action === 'cancel') return customArtApi.cancel(id, cancelReason);
      const cart = await cartApi.add({ customArtRequestId: id });
      qc.setQueryData(['cart'], cart);
      return cart;
    },
    onSuccess: (_d, action) => {
      setFeedback('');
      setShowCancel(false);
      refresh();
      if (action === 'addToCart') navigate('/cart');
    },
  });

  if (q.isLoading) return <Skeleton className="h-96" />;
  if (q.isError || !q.data) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const r = q.data;
  const can = (a: string) => r.allowedActions.includes(a as never);
  const byKind = (k: string) => r.images.filter((i) => i.kind === k);
  const previews = byKind('PREVIEW');
  const finals = byKind('FINAL');
  const remaining = r.maxRevisions - r.revisionCount;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs text-gray-400">{r.requestNumber}</p>
          <h1 className="text-2xl font-semibold">{r.title ?? `${r.style?.name ?? 'Custom'} artwork`}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <Avatar src={r.artist.avatarUrl} name={r.artist.displayName} size={24} />
            <Link to={`/artists/${r.artist.slug}`} className="hover:text-brand">
              {r.artist.displayName}
            </Link>
            · <StatusPill status={r.status} />
          </div>
        </div>
        <div className="text-right">
          {r.quotedPrice ? (
            <>
              <p className="text-xs text-gray-400">Quoted price</p>
              <p className="text-2xl font-semibold">{money(r.quotedPrice, r.currency)}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Waiting for the artist’s quote{r.budget ? ` · your budget ${money(r.budget)}` : ''}</p>
          )}
          {r.order && (
            <Link to={`/account/orders/${r.order.id}`} className="text-xs text-brand hover:underline">
              Order {r.order.orderNumber} · {humanize(r.order.paymentStatus)}
            </Link>
          )}
        </div>
      </div>

      <Timeline request={r} />

      {r.artistMessage && (
        <div className="flex gap-3 rounded-2xl bg-brand-light p-4 text-sm">
          <MessageSquare size={18} className="shrink-0 text-brand" />
          <div>
            <p className="font-semibold text-brand">Message from {r.artist.displayName}</p>
            <p className="mt-1 whitespace-pre-line text-gray-700">{r.artistMessage}</p>
          </div>
        </div>
      )}

      {act.isError && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{errorMessage(act.error)}</p>}

      {previews.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Previews</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {previews.map((img) => (
              <motion.figure key={img.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl">
                <img src={img.url} alt="Artist preview" className="w-full object-cover" onContextMenu={(e) => e.preventDefault()} />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                  {img.label ?? (img.isAiGenerated ? 'AI-generated preview' : 'Preview')}
                </span>
                <figcaption className="p-2 text-xs text-gray-400">{dateTime(img.createdAt)}</figcaption>
              </motion.figure>
            ))}
          </div>
        </section>
      )}

      {(can('approve') || can('revision')) && (
        <section className="card space-y-4 p-6">
          <h2 className="font-semibold">How does the preview look?</h2>
          {can('revision') && (
            <>
              <textarea
                className="input min-h-24"
                placeholder="Describe what you would like changed…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                aria-label="Revision feedback"
              />
              <p className="text-xs text-gray-500">
                {remaining} revision{remaining === 1 ? '' : 's'} remaining
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-3">
            {can('approve') && (
              <button className="btn-brand" disabled={act.isPending} onClick={() => act.mutate('approve')}>
                <Check size={16} /> Approve preview
              </button>
            )}
            {can('revision') && (
              <button className="btn-outline" disabled={act.isPending || feedback.trim().length < 5} onClick={() => act.mutate('revision')}>
                <RotateCcw size={16} /> Request revision
              </button>
            )}
          </div>
        </section>
      )}

      {can('addToCart') && (
        <section className="flex flex-col items-start gap-3 rounded-3xl bg-gradient-to-r from-brand to-magenta p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">You approved the preview 🎉</p>
            <p className="text-sm text-white/80">Complete your purchase so {r.artist.displayName} can finalize your artwork.</p>
          </div>
          <button className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand" disabled={act.isPending} onClick={() => act.mutate('addToCart')}>
            <ShoppingBag size={16} className="mr-1 inline" /> Add to cart & checkout
          </button>
        </section>
      )}
      {r.inCart && !r.order && (
        <p className="text-sm">
          This artwork is in your cart.{' '}
          <Link to="/checkout" className="font-semibold text-brand">
            Checkout now →
          </Link>
        </p>
      )}

      {finals.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Final artwork</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {finals.map((img) => (
              <div key={img.id} className="overflow-hidden rounded-2xl border border-gray-100">
                <img src={img.url} alt="Final artwork" className="w-full object-cover" />
                <a href={img.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-3 text-sm font-semibold text-brand hover:bg-brand-light">
                  <Download size={15} /> Download
                </a>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">Download links are private and expire after a few minutes — refresh this page to get a new one.</p>
        </section>
      )}
      {can('complete') && (
        <button className="btn-brand" disabled={act.isPending} onClick={() => act.mutate('complete')}>
          <Check size={16} /> I’ve received my artwork — mark complete
        </button>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 font-semibold">Your photos</h2>
          <div className="grid grid-cols-3 gap-2">
            {[...byKind('SOURCE'), ...byKind('REFERENCE')].map((img) => (
              <img key={img.id} src={img.url} alt="Your uploaded photo" className="aspect-square rounded-xl object-cover" />
            ))}
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <h2 className="font-semibold">Brief</h2>
          <p className="whitespace-pre-line rounded-2xl bg-gray-50 p-4 text-gray-700">{r.instructions}</p>
          {r.options &&
            Object.entries(r.options).map(([k, v]) => (
              <p key={k}>
                <span className="capitalize text-gray-500">{k}:</span> {v}
              </p>
            ))}
          <p>
            <span className="text-gray-500">Format:</span> {humanize(r.requestedFormat)} {r.requestedDimensions && `· ${r.requestedDimensions}`}
          </p>
          {r.dueDate && (
            <p>
              <span className="text-gray-500">Expected by:</span> {date(r.dueDate)}
            </p>
          )}
        </div>
      </section>

      {r.revisions.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Revision requests</h2>
          <ul className="space-y-2">
            {r.revisions.map((v) => (
              <li key={v.revisionNumber} className="rounded-2xl bg-gray-50 p-3 text-sm">
                <span className="font-semibold">#{v.revisionNumber}</span> · {v.feedback} <span className="text-xs text-gray-400">({date(v.createdAt)})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">History</h2>
        <ol className="relative space-y-4 border-l border-gray-200 pl-6">
          {r.statusHistory.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-brand ring-4 ring-white" />
              <p className="text-sm font-semibold">{humanize(h.toStatus)}</p>
              <p className="text-xs text-gray-400">
                {dateTime(h.createdAt)} · {humanize(h.actorRole)}
              </p>
              {h.note && <p className="mt-1 text-sm text-gray-600">{h.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      {can('cancel') &&
        (showCancel ? (
          <div className="card space-y-3 p-5">
            <textarea className="input" placeholder="Reason for cancelling" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} aria-label="Cancel reason" />
            <div className="flex gap-3">
              <button className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white" disabled={act.isPending || cancelReason.trim().length < 3} onClick={() => act.mutate('cancel')}>
                Confirm cancellation
              </button>
              <button className="btn-outline" onClick={() => setShowCancel(false)}>
                Keep request
              </button>
            </div>
          </div>
        ) : (
          <button className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline" onClick={() => setShowCancel(true)}>
            <X size={14} /> Cancel request
          </button>
        ))}
    </div>
  );
}

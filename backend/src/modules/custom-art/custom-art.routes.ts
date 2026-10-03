import type { CustomArtStatus, Prisma, RoleName } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { createSignedFileUrl } from '../../providers/storage/signed-url.js';
import { audit, notify } from '../../shared/audit.js';
import { AppError, badRequest, conflict, notFound } from '../../shared/errors.js';
import { created, ok, type AuthUser, type RequestContext, type RouteDef } from '../../shared/http.js';
import { processAndStoreImage, storeOriginalImage } from '../../shared/images.js';
import {
  artistCardSelect,
  artistMiniSelect,
  artworkCardSelect,
  money,
  publicArtistWhere,
  publicArtworkWhere,
  refSelect,
  toArtistCard,
  toArtworkCard,
} from '../../shared/serializers.js';
import { pageMeta, pagination, parse } from '../../shared/validation.js';
import { referenceCode } from '../../utils/slug.js';
import { ACTIVE_ORDER_STATUSES, getSetting, grantDigitalAccess } from '../orders/order-helpers.js';
import { allowedNextStatuses, assertTransition, canRequestRevision, TransitionError, type Actor } from './state-machine.js';

const BASE = '/custom-art/requests';

/** Status each named action moves the request to. */
const ACTION_TARGET: Record<string, CustomArtStatus> = {
  review: 'ARTIST_REVIEWING',
  accept: 'ACCEPTED',
  reject: 'REJECTED',
  start: 'IN_PROGRESS',
  preview: 'PREVIEW_READY',
  revision: 'REVISION_REQUESTED',
  approve: 'CUSTOMER_APPROVED',
  final: 'FINALIZING',
  complete: 'COMPLETED',
  cancel: 'CANCELLED',
};
const TARGET_ACTION = Object.fromEntries(Object.entries(ACTION_TARGET).map(([a, s]) => [s, a])) as Record<CustomArtStatus, string>;

const summaryInclude = {
  artist: { select: { ...artistMiniSelect, userId: true } },
  customer: { select: { id: true, fullName: true } },
  selectedStyle: { select: refSelect },
  images: { orderBy: { createdAt: 'asc' }, select: { id: true, kind: true, storageKey: true, createdAt: true, isAiGenerated: true } },
  orderItems: {
    where: { order: { status: { in: [...ACTIVE_ORDER_STATUSES] } } },
    select: { order: { select: { id: true, orderNumber: true, paymentStatus: true, status: true } } },
    take: 1,
  },
} satisfies Prisma.CustomArtRequestInclude;

type RequestRow = Prisma.CustomArtRequestGetPayload<{ include: typeof summaryInclude }>;

/** The caller's relationship to a request decides their actor role; unrelated users see 404. */
function actorFor(user: AuthUser, req: { customerId: string; artistId: string }): Actor | null {
  if (req.customerId === user.id) return 'CUSTOMER';
  if (user.artistId && req.artistId === user.artistId) return 'ARTIST';
  if (user.roles.includes('ADMIN')) return 'ADMIN';
  return null;
}

async function loadForActor(ctx: RequestContext) {
  const req = await prisma.customArtRequest.findUnique({ where: { id: ctx.params.id }, include: summaryInclude });
  if (!req) throw notFound('Custom art request');
  const actor = actorFor(ctx.user!, req);
  if (!actor) throw notFound('Custom art request');
  return { req, actor };
}

/** Final images of DIGITAL commissions are the deliverable: customers only see them once paid. */
function canSeeImage(kind: string, actor: Actor, req: RequestRow) {
  if (kind !== 'FINAL' || actor !== 'CUSTOMER') return true;
  if (req.requestedFormat !== 'DIGITAL') return true;
  return req.orderItems[0]?.order.paymentStatus === 'PAID';
}

function summarize(req: RequestRow, viewer: AuthUser, actor: Actor) {
  const sign = (key: string) => createSignedFileUrl(key, viewer.id);
  const source = req.images.find((i) => i.kind === 'SOURCE');
  const previews = req.images.filter((i) => i.kind === 'PREVIEW');
  const latestPreview = previews[previews.length - 1];
  const artist = { id: req.artist.id, slug: req.artist.slug, displayName: req.artist.displayName, avatarUrl: req.artist.avatarUrl };
  return {
    id: req.id,
    requestNumber: req.requestNumber,
    status: req.status,
    title: req.title,
    requestedFormat: req.requestedFormat,
    budget: money(req.budget),
    quotedPrice: money(req.quotedPrice),
    currency: req.currency,
    revisionCount: req.revisionCount,
    maxRevisions: req.maxRevisions,
    createdAt: req.createdAt,
    updatedAt: req.updatedAt,
    artist,
    customer: req.customer,
    style: req.selectedStyle,
    sourceThumbUrl: source ? sign(source.storageKey) : null,
    latestPreviewUrl: latestPreview ? sign(latestPreview.storageKey) : null,
    paymentStatus: req.orderItems[0]?.order.paymentStatus ?? null,
    viewerRole: actor,
  };
}

async function allowedActions(req: RequestRow, actor: Actor, userId: string): Promise<string[]> {
  const activeOrder = req.orderItems[0]?.order ?? null;
  const actions = allowedNextStatuses(req.status, actor)
    .map((s) => TARGET_ACTION[s])
    .filter((a) => {
      if (a === 'revision') return canRequestRevision(req.revisionCount, req.maxRevisions);
      if (a === 'final') return !!activeOrder;
      return true;
    });
  if (actor === 'CUSTOMER' && req.status === 'CUSTOMER_APPROVED' && !activeOrder) {
    const inCart = await prisma.cartItem.count({ where: { customArtRequestId: req.id, cart: { userId } } });
    if (!inCart) actions.push('addToCart');
  }
  return actions;
}

async function detail(id: string, viewer: AuthUser) {
  const req = await prisma.customArtRequest.findUniqueOrThrow({ where: { id }, include: summaryInclude });
  const actor = actorFor(viewer, req)!;
  const full = await prisma.customArtRequest.findUniqueOrThrow({
    where: { id },
    select: {
      instructions: true,
      options: true,
      requestedDimensions: true,
      artistMessage: true,
      customerMessage: true,
      dueDate: true,
      selectedArtwork: { select: artworkCardSelect },
      revisions: { orderBy: { revisionNumber: 'asc' }, select: { revisionNumber: true, feedback: true, createdAt: true } },
      statusHistory: { orderBy: { createdAt: 'asc' }, select: { fromStatus: true, toStatus: true, actorRole: true, note: true, createdAt: true } },
    },
  });
  const inCart = await prisma.cartItem.count({ where: { customArtRequestId: id, cart: { userId: viewer.id } } });
  return {
    ...summarize(req, viewer, actor),
    instructions: full.instructions,
    options: full.options,
    requestedDimensions: full.requestedDimensions,
    artistMessage: full.artistMessage,
    customerMessage: full.customerMessage,
    dueDate: full.dueDate,
    selectedArtwork: full.selectedArtwork ? toArtworkCard(full.selectedArtwork) : null,
    images: req.images
      .filter((i) => canSeeImage(i.kind, actor, req))
      .map((i) => ({
        id: i.id,
        kind: i.kind,
        url: createSignedFileUrl(i.storageKey, viewer.id),
        createdAt: i.createdAt,
        isAiGenerated: i.isAiGenerated,
        label: i.isAiGenerated ? 'AI-generated preview' : null,
      })),
    revisions: full.revisions,
    statusHistory: full.statusHistory,
    allowedActions: await allowedActions(req, actor, viewer.id),
    order: req.orderItems[0]?.order ?? null,
    inCart: inCart > 0,
  };
}

type Tx = Prisma.TransactionClient;

/**
 * Performs a guarded transition. The UPDATE is conditional on the current status
 * (optimistic concurrency), so two parallel requests cannot both advance the same state.
 */
async function transition(
  ctx: RequestContext,
  to: CustomArtStatus,
  opts: { note?: string; data?: Prisma.CustomArtRequestUncheckedUpdateManyInput; before?: (tx: Tx, req: RequestRow, actor: Actor) => Promise<void>; after?: (tx: Tx, req: RequestRow, actor: Actor) => Promise<void> } = {},
) {
  const { req, actor } = await loadForActor(ctx);
  try {
    assertTransition(req.status, to, actor);
  } catch (e) {
    if (e instanceof TransitionError) throw new AppError(409, 'INVALID_TRANSITION', e.message);
    throw e;
  }
  await prisma.$transaction(async (tx) => {
    if (opts.before) await opts.before(tx, req, actor);
    const res = await tx.customArtRequest.updateMany({ where: { id: req.id, status: req.status }, data: { ...opts.data, status: to } });
    if (res.count !== 1) throw conflict('The request was updated by someone else. Refresh and try again.');
    await tx.customArtStatusHistory.create({
      data: { requestId: req.id, fromStatus: req.status, toStatus: to, actorId: ctx.user!.id, actorRole: actor as RoleName, note: opts.note?.slice(0, 2000) },
    });
    if (opts.after) await opts.after(tx, req, actor);

    const link = `/custom-art/requests/${req.id}`;
    const label = to.replace(/_/g, ' ').toLowerCase();
    if (actor !== 'CUSTOMER') {
      await notify(req.customerId, 'CUSTOM_ART_UPDATE', `Request ${req.requestNumber}: ${label}`, opts.note, link, tx);
    }
    if (actor !== 'ARTIST') {
      await notify(req.artist.userId, 'CUSTOM_ART_UPDATE', `Request ${req.requestNumber}: ${label}`, opts.note, link, tx);
    }
    if (actor === 'ADMIN') await audit(ctx.user, `CUSTOM_ART_${to}`, 'CustomArtRequest', req.id, { from: req.status, note: opts.note ?? null }, { ip: ctx.ip, tx });
  });
  return ok(await detail(req.id, ctx.user!));
}

const createSchema = z.object({
  artistId: z.string().min(1).max(40),
  styleId: z.string().min(1).max(40),
  selectedArtworkId: z.string().max(40).optional().or(z.literal('').transform(() => undefined)),
  title: z.string().trim().max(150).optional(),
  instructions: z.string().trim().min(10, 'Please describe what you would like (at least 10 characters)').max(5000),
  options: z
    .string()
    .max(5000)
    .optional()
    .transform((v, c) => {
      if (!v) return undefined;
      try {
        const parsed = JSON.parse(v);
        if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) throw new Error();
        const clean: Record<string, string> = {};
        for (const [k, val] of Object.entries(parsed)) {
          if (!/^[a-zA-Z]{1,30}$/.test(k)) continue;
          if (typeof val === 'string' && val.trim()) clean[k] = val.trim().slice(0, 500);
        }
        return clean;
      } catch {
        c.addIssue({ code: 'custom', message: 'options must be a JSON object' });
        return z.NEVER;
      }
    }),
  requestedDimensions: z.string().trim().max(100).optional(),
  requestedFormat: z.enum(['ORIGINAL', 'PRINT', 'DIGITAL']).default('DIGITAL'),
  budget: z.coerce.number().positive().max(10_000_000).optional().or(z.literal('').transform(() => undefined)),
});

const messageSchema = z.object({ message: z.string().trim().max(2000).optional() });

export const customArtRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/custom-art/artists',
    handler: async (ctx) => {
      const { styleId } = parse(z.object({ styleId: z.string().max(40).optional() }), ctx.query);
      const where: Prisma.ArtistWhereInput = { ...publicArtistWhere, acceptsCustomArt: true };
      const rows = await prisma.artist.findMany({ where, select: artistCardSelect, orderBy: [{ isFeatured: 'desc' }, { ratingAverage: 'desc' }], take: 60 });
      let cards = rows.map(toArtistCard);
      if (styleId) {
        // Artists who list the selected style come first; others remain selectable.
        cards = [...cards.filter((c) => c.styles.some((s) => s.id === styleId)), ...cards.filter((c) => !c.styles.some((s) => s.id === styleId))];
      }
      return ok(cards);
    },
  },
  {
    method: 'POST',
    path: BASE,
    auth: 'required',
    rateLimit: 'upload',
    upload: { field: 'photos', maxCount: 5 },
    handler: async (ctx) => {
      const input = parse(createSchema, ctx.body);
      if (ctx.files.length < 1) throw badRequest('Upload at least one photo');
      if (ctx.files.length > 5) throw badRequest('You can upload up to 5 photos');

      const artist = await prisma.artist.findFirst({ where: { id: input.artistId, ...publicArtistWhere }, select: { id: true, userId: true, acceptsCustomArt: true, displayName: true } });
      if (!artist) throw badRequest('Selected artist is not available');
      if (!artist.acceptsCustomArt) throw badRequest('This artist is not accepting custom art requests');
      if (artist.id === ctx.user!.artistId) throw badRequest('You cannot commission yourself');
      const style = await prisma.artworkStyle.findFirst({ where: { id: input.styleId, isActive: true, availableForCustomArt: true } });
      if (!style) throw badRequest('Selected style is not available for custom art');
      if (input.selectedArtworkId) {
        const art = await prisma.artwork.findFirst({ where: { id: input.selectedArtworkId, ...publicArtworkWhere } });
        if (!art) throw badRequest('Selected inspiration artwork is not available');
      }

      // Validate + re-encode every photo BEFORE creating anything (EXIF/GPS stripped).
      const stored = [];
      for (const file of ctx.files) {
        const img = await processAndStoreImage(file, 'customArtSource', { thumbnail: false, maxDimension: 3000, minWidth: 300, minHeight: 300 });
        stored.push(img);
      }
      const maxRevisions = Number(await getSetting<number>('customArt.maxRevisions', 2));

      const request = await prisma.customArtRequest.create({
        data: {
          requestNumber: referenceCode('CA'),
          customerId: ctx.user!.id,
          artistId: artist.id,
          selectedStyleId: style.id,
          selectedArtworkId: input.selectedArtworkId,
          title: input.title || `${style.name} portrait`,
          instructions: input.instructions,
          options: input.options,
          requestedDimensions: input.requestedDimensions,
          requestedFormat: input.requestedFormat,
          budget: input.budget,
          maxRevisions,
          images: {
            create: stored.map((s) => ({
              kind: 'SOURCE' as const,
              storageKey: s.main.key,
              mimeType: s.main.contentType,
              width: s.width,
              height: s.height,
              sizeBytes: s.main.size,
              uploadedById: ctx.user!.id,
            })),
          },
          statusHistory: { create: { toStatus: 'REQUESTED', actorId: ctx.user!.id, actorRole: 'CUSTOMER', note: 'Request submitted' } },
        },
      });
      await notify(artist.userId, 'CUSTOM_ART_NEW', 'New custom art request', `${ctx.user!.fullName} requested a ${style.name} artwork.`, `/seller/custom-art/${request.id}`);
      return created(await detail(request.id, ctx.user!));
    },
  },
  {
    method: 'GET',
    path: BASE,
    auth: 'required',
    handler: async (ctx) => {
      const q = parse(
        pagination.extend({
          as: z.enum(['customer', 'artist', 'admin']).default('customer'),
          status: z.string().max(40).optional(),
          q: z.string().trim().max(100).optional(),
        }),
        ctx.query,
      );
      const user = ctx.user!;
      let where: Prisma.CustomArtRequestWhereInput;
      if (q.as === 'admin') {
        if (!user.roles.includes('ADMIN')) throw new AppError(403, 'FORBIDDEN', 'Admin only');
        where = {};
      } else if (q.as === 'artist') {
        if (!user.artistId) throw new AppError(403, 'FORBIDDEN', 'Artist account required');
        where = { artistId: user.artistId };
      } else {
        where = { customerId: user.id };
      }
      if (q.status) {
        const statuses = q.status.split(',').filter(Boolean) as CustomArtStatus[];
        where.status = { in: statuses };
      }
      if (q.q) where.OR = [{ requestNumber: { contains: q.q } }, { title: { contains: q.q } }];
      const [total, rows] = await Promise.all([
        prisma.customArtRequest.count({ where }),
        prisma.customArtRequest.findMany({ where, include: summaryInclude, orderBy: { updatedAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      ]);
      const role: Actor = q.as === 'admin' ? 'ADMIN' : q.as === 'artist' ? 'ARTIST' : 'CUSTOMER';
      return ok(
        rows.map((r) => summarize(r, user, role)),
        pageMeta(q.page, q.pageSize, total),
      );
    },
  },
  {
    method: 'GET',
    path: `${BASE}/:id`,
    auth: 'required',
    handler: async (ctx) => {
      const { req } = await loadForActor(ctx);
      return ok(await detail(req.id, ctx.user!));
    },
  },
  {
    method: 'PATCH',
    path: `${BASE}/:id/review`,
    auth: 'required',
    handler: (ctx) => transition(ctx, 'ARTIST_REVIEWING', { note: 'Artist is reviewing your request' }),
  },
  {
    method: 'PATCH',
    path: `${BASE}/:id/accept`,
    auth: 'required',
    handler: async (ctx) => {
      const input = parse(
        z.object({
          quotedPrice: z.coerce.number().positive('Quoted price must be greater than zero').max(10_000_000),
          artistMessage: z.string().trim().max(2000).optional(),
          dueDate: z.coerce.date().optional(),
          maxRevisions: z.coerce.number().int().min(0).max(10).optional(),
        }),
        ctx.body,
      );
      return transition(ctx, 'ACCEPTED', {
        note: input.artistMessage ?? `Accepted with quote ${input.quotedPrice}`,
        data: { quotedPrice: input.quotedPrice, artistMessage: input.artistMessage, dueDate: input.dueDate, ...(input.maxRevisions !== undefined ? { maxRevisions: input.maxRevisions } : {}) },
      });
    },
  },
  {
    method: 'PATCH',
    path: `${BASE}/:id/reject`,
    auth: 'required',
    handler: async (ctx) => {
      const { reason } = parse(z.object({ reason: z.string().trim().min(3).max(2000) }), ctx.body);
      return transition(ctx, 'REJECTED', { note: reason, data: { artistMessage: reason } });
    },
  },
  {
    method: 'PATCH',
    path: `${BASE}/:id/start`,
    auth: 'required',
    handler: async (ctx) => {
      const { message } = parse(messageSchema, ctx.body ?? {});
      return transition(ctx, 'IN_PROGRESS', { note: message ?? 'Work in progress', data: message ? { artistMessage: message } : {} });
    },
  },
  {
    method: 'POST',
    path: `${BASE}/:id/preview`,
    auth: 'required',
    rateLimit: 'upload',
    upload: { field: 'images', maxCount: 4 },
    handler: async (ctx) => {
      const { message } = parse(messageSchema, ctx.body);
      if (!ctx.files.length) throw badRequest('Upload at least one preview image');
      const { req, actor } = await loadForActor(ctx);
      assertGuard(req.status, 'PREVIEW_READY', actor);
      const stored: Awaited<ReturnType<typeof processAndStoreImage>>[] = [];
      for (const f of ctx.files) stored.push(await processAndStoreImage(f, 'customArtPreview', { thumbnail: false, maxDimension: 1600 }));
      return transition(ctx, 'PREVIEW_READY', {
        note: message ?? 'Preview uploaded',
        data: message ? { artistMessage: message } : {},
        after: async (tx) => {
          await tx.customArtImage.createMany({
            data: stored.map((s) => ({ requestId: req.id, kind: 'PREVIEW' as const, storageKey: s.main.key, mimeType: s.main.contentType, width: s.width, height: s.height, sizeBytes: s.main.size, uploadedById: ctx.user!.id })),
          });
        },
      });
    },
  },
  {
    method: 'POST',
    path: `${BASE}/:id/revision`,
    auth: 'required',
    handler: async (ctx) => {
      const { feedback } = parse(z.object({ feedback: z.string().trim().min(5).max(3000) }), ctx.body);
      const { req } = await loadForActor(ctx);
      if (!canRequestRevision(req.revisionCount, req.maxRevisions)) {
        throw new AppError(409, 'REVISION_LIMIT', `All ${req.maxRevisions} revisions have been used`);
      }
      return transition(ctx, 'REVISION_REQUESTED', {
        note: feedback,
        data: { revisionCount: { increment: 1 }, customerMessage: feedback },
        after: async (tx, r) => {
          await tx.customArtRevision.create({ data: { requestId: r.id, revisionNumber: r.revisionCount + 1, feedback } });
        },
      });
    },
  },
  {
    method: 'PATCH',
    path: `${BASE}/:id/approve`,
    auth: 'required',
    handler: async (ctx) => {
      const { message } = parse(messageSchema, ctx.body ?? {});
      return transition(ctx, 'CUSTOMER_APPROVED', { note: message ?? 'Customer approved the preview', data: message ? { customerMessage: message } : {} });
    },
  },
  {
    method: 'POST',
    path: `${BASE}/:id/final`,
    auth: 'required',
    rateLimit: 'upload',
    upload: { field: 'images', maxCount: 4 },
    handler: async (ctx) => {
      const { message } = parse(messageSchema, ctx.body);
      if (!ctx.files.length) throw badRequest('Upload the final artwork');
      const { req, actor } = await loadForActor(ctx);
      assertGuard(req.status, 'FINALIZING', actor);
      if (!req.orderItems[0]) throw new AppError(409, 'ORDER_REQUIRED', 'The customer has not placed an order for this request yet');
      const stored: Awaited<ReturnType<typeof storeOriginalImage>>[] = [];
      for (const f of ctx.files) stored.push(await storeOriginalImage(f, 'customArtFinal', { minWidth: 300, minHeight: 300 }));
      return transition(ctx, 'FINALIZING', {
        note: message ?? 'Final artwork uploaded',
        data: message ? { artistMessage: message } : {},
        after: async (tx) => {
          await tx.customArtImage.createMany({
            data: stored.map((s) => ({ requestId: req.id, kind: 'FINAL' as const, storageKey: s.stored.key, mimeType: s.stored.contentType, width: s.width, height: s.height, sizeBytes: s.stored.size, uploadedById: ctx.user!.id })),
          });
          const item = await tx.orderItem.findFirst({ where: { customArtRequestId: req.id, order: { status: { in: [...ACTIVE_ORDER_STATUSES] } } } });
          if (item) await grantDigitalAccess(tx, item.id);
        },
      });
    },
  },
  {
    method: 'PATCH',
    path: `${BASE}/:id/complete`,
    auth: 'required',
    handler: async (ctx) =>
      transition(ctx, 'COMPLETED', {
        note: 'Request completed',
        after: async (tx, r) => {
          const item = await tx.orderItem.findFirst({ where: { customArtRequestId: r.id, order: { status: { in: [...ACTIVE_ORDER_STATUSES] } } } });
          if (!item) return;
          if (item.fulfillmentType === 'DIGITAL') await grantDigitalAccess(tx, item.id);
          else if (!['DELIVERED', 'CANCELLED'].includes(item.fulfillmentStatus)) {
            await tx.orderItem.update({ where: { id: item.id }, data: { fulfillmentStatus: 'DELIVERED' } });
          }
        },
      }),
  },
  {
    method: 'PATCH',
    path: `${BASE}/:id/cancel`,
    auth: 'required',
    handler: async (ctx) => {
      const { reason } = parse(z.object({ reason: z.string().trim().min(3).max(2000) }), ctx.body);
      return transition(ctx, 'CANCELLED', {
        note: reason,
        before: async (tx, r) => {
          if (r.orderItems[0]) throw new AppError(409, 'HAS_ORDER', 'This request has an active order — cancel the order first');
          await tx.cartItem.deleteMany({ where: { customArtRequestId: r.id } });
        },
      });
    },
  },
];

function assertGuard(from: CustomArtStatus, to: CustomArtStatus, actor: Actor) {
  try {
    assertTransition(from, to, actor);
  } catch (e) {
    if (e instanceof TransitionError) throw new AppError(409, 'INVALID_TRANSITION', e.message);
    throw e;
  }
}

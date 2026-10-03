import type { ArtworkStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { storage } from '../../providers/storage/index.js';
import { audit } from '../../shared/audit.js';
import { badRequest, conflict, notFound } from '../../shared/errors.js';
import { created, ok, type AuthUser, type RouteDef } from '../../shared/http.js';
import { processAndStoreImage, storeOriginalImage } from '../../shared/images.js';
import { artistMiniSelect, artworkCardSelect, availableQuantity, money, publicArtworkWhere, refSelect, toArtworkCard } from '../../shared/serializers.js';
import { pageMeta, parse, pagination, stringList } from '../../shared/validation.js';
import { referenceCode, slugify, uniqueSlug } from '../../utils/slug.js';
import {
  ARTWORK_IMAGE_RULES,
  MAX_IMAGES_PER_ARTWORK,
  artworkFilterSchema,
  findCards,
  isWishlisted,
  listPublicArtworks,
  ownedArtwork,
  requireArtist,
  thumbKeyFor,
} from './artwork.service.js';

const optionalId = z.string().max(40).nullable().optional();
const dim = z.coerce.number().positive().max(10000).nullable().optional();

const artworkBody = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(10000).nullable().optional(),
  type: z.enum(['ORIGINAL_PAINTING', 'DIGITAL_ART', 'PRINT', 'PORTRAIT', 'ILLUSTRATION', 'PHOTOGRAPHY', 'WALL_ART', 'ABSTRACT', 'CUSTOM_ART', 'OTHER']),
  format: z.enum(['ORIGINAL', 'PRINT', 'DIGITAL']),
  categoryId: optionalId,
  styleId: optionalId,
  mediumId: optionalId,
  themeId: optionalId,
  tags: stringList.optional(),
  yearCreated: z.coerce.number().int().min(1000).max(new Date().getFullYear() + 1).nullable().optional(),
  widthCm: dim,
  heightCm: dim,
  depthCm: dim,
  orientation: z.enum(['PORTRAIT', 'LANDSCAPE', 'SQUARE', 'PANORAMIC']).nullable().optional(),
  dominantColor: z.string().trim().max(40).nullable().optional(),
  price: z.coerce.number().positive().max(100_000_000),
  discountPrice: z.coerce.number().positive().max(100_000_000).nullable().optional(),
  quantity: z.coerce.number().int().min(0).max(100000).optional(),
  isCustomizable: z.boolean().optional(),
  licenseInfo: z.string().trim().max(2000).nullable().optional(),
  copyrightInfo: z.string().trim().max(1000).nullable().optional(),
  collectionIds: z.array(z.string().max(40)).max(30).optional(),
});

/** Fields whose change on an APPROVED artwork requires re-review (commerce fields don't). */
const CONTENT_FIELDS = [
  'title', 'description', 'type', 'format', 'categoryId', 'styleId', 'mediumId', 'themeId', 'tags', 'yearCreated',
  'widthCm', 'heightCm', 'depthCm', 'orientation', 'dominantColor', 'isCustomizable', 'licenseInfo', 'copyrightInfo',
] as const;

async function assertTaxonomy(input: Partial<z.infer<typeof artworkBody>>) {
  const checks: Array<[string | null | undefined, () => Promise<unknown>, string]> = [
    [input.categoryId, () => prisma.artworkCategory.findFirst({ where: { id: input.categoryId!, isActive: true } }), 'category'],
    [input.styleId, () => prisma.artworkStyle.findFirst({ where: { id: input.styleId!, isActive: true } }), 'style'],
    [input.mediumId, () => prisma.artworkMedium.findFirst({ where: { id: input.mediumId!, isActive: true } }), 'medium'],
    [input.themeId, () => prisma.artworkTheme.findFirst({ where: { id: input.themeId!, isActive: true } }), 'theme'],
  ];
  for (const [id, load, label] of checks) if (id && !(await load())) throw badRequest(`Unknown ${label}`);
}

async function tagConnections(tags: string[]) {
  const ids: string[] = [];
  for (const raw of [...new Set(tags.map((t) => t.trim()).filter(Boolean))].slice(0, 20)) {
    const name = raw.slice(0, 50);
    const slug = slugify(name);
    const tag = await prisma.artworkTag.upsert({ where: { slug }, update: {}, create: { name, slug } });
    ids.push(tag.id);
  }
  return ids;
}

async function syncCollections(artistId: string, artworkId: string, collectionIds: string[]) {
  const owned = await prisma.artworkCollection.findMany({ where: { id: { in: collectionIds }, artistId }, select: { id: true } });
  await prisma.collectionItem.deleteMany({ where: { artworkId, collection: { artistId } } });
  if (owned.length) {
    await prisma.collectionItem.createMany({ data: owned.map((c) => ({ collectionId: c.id, artworkId })), skipDuplicates: true });
  }
}

async function recordStatus(artworkId: string, from: ArtworkStatus | null, to: ArtworkStatus, actor: AuthUser | null, reason?: string) {
  await prisma.artworkApproval.create({ data: { artworkId, actorId: actor?.id, fromStatus: from, toStatus: to, reason } });
}

async function refreshPrimary(artworkId: string) {
  const images = await prisma.artworkImage.findMany({ where: { artworkId }, orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] });
  let primary = images.find((i) => i.isPrimary);
  if (!primary && images[0]) {
    primary = await prisma.artworkImage.update({ where: { id: images[0].id }, data: { isPrimary: true } });
  }
  await prisma.artwork.update({
    where: { id: artworkId },
    data: { thumbnailUrl: primary?.thumbUrl ?? primary?.url ?? null, previewUrl: primary?.url ?? null },
  });
}

/** Back to review when an approved artwork's content changes. */
async function requeueIfApproved(artwork: { id: string; status: ArtworkStatus }, actor: AuthUser | null, reason: string) {
  if (artwork.status !== 'APPROVED') return artwork.status;
  await prisma.artwork.update({ where: { id: artwork.id }, data: { status: 'PENDING_REVIEW' } });
  await recordStatus(artwork.id, 'APPROVED', 'PENDING_REVIEW', actor, reason);
  return 'PENDING_REVIEW' as ArtworkStatus;
}

const sellerDetailSelect = {
  id: true, slug: true, title: true, description: true, type: true, format: true, status: true,
  categoryId: true, styleId: true, mediumId: true, themeId: true, yearCreated: true, widthCm: true, heightCm: true,
  depthCm: true, orientation: true, dominantColor: true, price: true, discountPrice: true, currency: true, sku: true,
  isFeatured: true, isCustomizable: true, licenseInfo: true, copyrightInfo: true, thumbnailUrl: true, previewUrl: true,
  digitalFileKey: true, viewCount: true, salesCount: true, wishlistCount: true, publishedAt: true, createdAt: true, updatedAt: true,
  category: { select: refSelect }, style: { select: refSelect }, medium: { select: refSelect }, theme: { select: refSelect },
  images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], select: { id: true, url: true, thumbUrl: true, width: true, height: true, isPrimary: true, altText: true, sortOrder: true } },
  tags: { select: { tag: { select: refSelect } } },
  collectionItems: { select: { collectionId: true } },
  inventory: { select: { quantity: true, reserved: true } },
  approvals: { orderBy: { createdAt: 'desc' }, take: 20, select: { fromStatus: true, toStatus: true, reason: true, createdAt: true } },
} satisfies Prisma.ArtworkSelect;

function toSellerDetail(a: Prisma.ArtworkGetPayload<{ select: typeof sellerDetailSelect }>) {
  const { digitalFileKey, tags, collectionItems, inventory, ...rest } = a;
  return {
    ...rest,
    price: money(a.price),
    discountPrice: money(a.discountPrice),
    widthCm: money(a.widthCm),
    heightCm: money(a.heightCm),
    depthCm: money(a.depthCm),
    tags: tags.map((t) => t.tag),
    collectionIds: collectionItems.map((c) => c.collectionId),
    quantity: inventory?.quantity ?? 0,
    reserved: inventory?.reserved ?? 0,
    hasDigitalFile: !!digitalFileKey,
  };
}

async function sellerDetail(id: string) {
  const a = await prisma.artwork.findUniqueOrThrow({ where: { id }, select: sellerDetailSelect });
  return toSellerDetail(a);
}

function validatePricing(price: number | undefined, discount: number | null | undefined) {
  if (price !== undefined && discount !== undefined && discount !== null && discount >= price) {
    throw badRequest('Discount price must be lower than the price');
  }
}

// ───────────────────────────── Seller routes ─────────────────────────────

const sellerRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/artists/me/artworks',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const artistId = requireArtist(ctx.user);
      const q = parse(
        pagination.extend({
          status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'SOLD_OUT', 'ARCHIVED']).optional(),
          q: z.string().max(120).optional(),
        }),
        ctx.query,
      );
      const where: Prisma.ArtworkWhereInput = {
        artistId,
        ...(q.status ? { status: q.status } : { status: { not: 'ARCHIVED' } }),
        ...(q.q ? { title: { contains: q.q } } : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.artwork.count({ where }),
        prisma.artwork.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
          select: { ...artworkCardSelect, viewCount: true, salesCount: true, wishlistCount: true, updatedAt: true, sku: true },
        }),
      ]);
      const data = rows.map((r) => ({
        ...toArtworkCard(r),
        viewCount: r.viewCount,
        salesCount: r.salesCount,
        wishlistCount: r.wishlistCount,
        updatedAt: r.updatedAt,
        sku: r.sku,
        quantity: r.inventory?.quantity ?? 0,
      }));
      return ok(data, pageMeta(q.page, q.pageSize, total));
    },
  },
  {
    method: 'GET',
    path: '/artists/me/artworks/:id',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const artwork = await ownedArtwork(ctx.user, ctx.params.id);
      return ok(await sellerDetail(artwork.id));
    },
  },
  {
    method: 'POST',
    path: '/artworks',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const artistId = requireArtist(ctx.user);
      const input = parse(artworkBody, ctx.body);
      validatePricing(input.price, input.discountPrice);
      await assertTaxonomy(input);
      const tagIds = await tagConnections(input.tags ?? []);
      const artwork = await prisma.artwork.create({
        data: {
          artistId,
          title: input.title,
          slug: uniqueSlug(input.title),
          sku: referenceCode('ART'),
          description: input.description,
          type: input.type,
          format: input.format,
          status: 'DRAFT',
          categoryId: input.categoryId ?? null,
          styleId: input.styleId ?? null,
          mediumId: input.mediumId ?? null,
          themeId: input.themeId ?? null,
          yearCreated: input.yearCreated,
          widthCm: input.widthCm,
          heightCm: input.heightCm,
          depthCm: input.depthCm,
          orientation: input.orientation,
          dominantColor: input.dominantColor,
          price: input.price,
          discountPrice: input.discountPrice,
          isCustomizable: input.isCustomizable ?? false,
          licenseInfo: input.licenseInfo,
          copyrightInfo: input.copyrightInfo,
          inventory: { create: { quantity: input.format === 'ORIGINAL' ? Math.min(input.quantity ?? 1, 1) : (input.quantity ?? 1) } },
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
      });
      await recordStatus(artwork.id, null, 'DRAFT', ctx.user, 'Created');
      if (input.collectionIds?.length) await syncCollections(artistId, artwork.id, input.collectionIds);
      await audit(ctx.user, 'ARTWORK_CREATED', 'Artwork', artwork.id, { title: artwork.title }, { ip: ctx.ip });
      return created(await sellerDetail(artwork.id));
    },
  },
  {
    method: 'PATCH',
    path: '/artworks/:id',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const artwork = await ownedArtwork(ctx.user, ctx.params.id);
      if (artwork.status === 'SUSPENDED') throw conflict('This artwork is suspended by moderation and cannot be edited');
      if (artwork.status === 'ARCHIVED') throw conflict('Archived artwork cannot be edited');
      const input = parse(artworkBody.partial(), ctx.body);
      validatePricing(input.price ?? Number(artwork.price), input.discountPrice);
      await assertTaxonomy(input);

      const data: Prisma.ArtworkUncheckedUpdateInput = {};
      const assign = <K extends keyof typeof input>(k: K) => {
        if (input[k] !== undefined) (data as Record<string, unknown>)[k] = input[k];
      };
      (['title', 'description', 'type', 'format', 'categoryId', 'styleId', 'mediumId', 'themeId', 'yearCreated', 'widthCm', 'heightCm',
        'depthCm', 'orientation', 'dominantColor', 'price', 'discountPrice', 'isCustomizable', 'licenseInfo', 'copyrightInfo'] as const).forEach(assign);

      await prisma.artwork.update({ where: { id: artwork.id }, data });
      if (input.tags) {
        const tagIds = await tagConnections(input.tags);
        await prisma.artworkTagOnArtwork.deleteMany({ where: { artworkId: artwork.id } });
        await prisma.artworkTagOnArtwork.createMany({ data: tagIds.map((tagId) => ({ artworkId: artwork.id, tagId })) });
      }
      if (input.quantity !== undefined) {
        const format = input.format ?? artwork.format;
        const quantity = format === 'ORIGINAL' ? Math.min(input.quantity, 1) : input.quantity;
        await prisma.artworkInventory.upsert({ where: { artworkId: artwork.id }, update: { quantity }, create: { artworkId: artwork.id, quantity } });
        if (artwork.status === 'SOLD_OUT' && quantity > 0) {
          await prisma.artwork.update({ where: { id: artwork.id }, data: { status: 'APPROVED' } });
          await recordStatus(artwork.id, 'SOLD_OUT', 'APPROVED', ctx.user, 'Restocked');
        }
      }
      if (input.collectionIds) await syncCollections(artwork.artistId, artwork.id, input.collectionIds);

      const contentChanged = CONTENT_FIELDS.some((f) => input[f] !== undefined);
      if (contentChanged) {
        if (artwork.status === 'REJECTED') {
          await prisma.artwork.update({ where: { id: artwork.id }, data: { status: 'DRAFT' } });
          await recordStatus(artwork.id, 'REJECTED', 'DRAFT', ctx.user, 'Edited after rejection');
        } else {
          await requeueIfApproved(artwork, ctx.user, 'Content edited — re-review required');
        }
      }
      await audit(ctx.user, 'ARTWORK_UPDATED', 'Artwork', artwork.id, { fields: Object.keys(input) }, { ip: ctx.ip });
      return ok(await sellerDetail(artwork.id));
    },
  },
  {
    method: 'DELETE',
    path: '/artworks/:id',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const artwork = await ownedArtwork(ctx.user, ctx.params.id);
      if (artwork.status !== 'ARCHIVED') {
        await prisma.artwork.update({ where: { id: artwork.id }, data: { status: 'ARCHIVED', isFeatured: false } });
        await recordStatus(artwork.id, artwork.status, 'ARCHIVED', ctx.user, 'Archived by artist');
        await audit(ctx.user, 'ARTWORK_ARCHIVED', 'Artwork', artwork.id, undefined, { ip: ctx.ip });
      }
      return ok({ id: artwork.id, status: 'ARCHIVED' });
    },
  },
  {
    method: 'POST',
    path: '/artworks/:id/images',
    roles: ['ARTIST'],
    upload: { field: 'images', maxCount: 8 },
    rateLimit: 'upload',
    handler: async (ctx) => {
      const artwork = await ownedArtwork(ctx.user, ctx.params.id);
      if (artwork.status === 'SUSPENDED' || artwork.status === 'ARCHIVED') throw conflict('Images cannot be changed in the current status');
      if (!ctx.files.length) throw badRequest('Attach at least one image in the "images" field');
      const existing = await prisma.artworkImage.count({ where: { artworkId: artwork.id } });
      if (existing + ctx.files.length > MAX_IMAGES_PER_ARTWORK) throw badRequest(`An artwork can have at most ${MAX_IMAGES_PER_ARTWORK} images`);

      // Validate everything before persisting anything.
      const stored = [];
      for (const file of ctx.files) stored.push(await processAndStoreImage(file, 'artworks', ARTWORK_IMAGE_RULES));
      let order = existing;
      for (const img of stored) {
        await prisma.artworkImage.create({
          data: {
            artworkId: artwork.id,
            url: img.main.url!,
            thumbUrl: img.thumb?.url ?? null,
            storageKey: img.main.key,
            width: img.width,
            height: img.height,
            isPrimary: false,
            sortOrder: order++,
            altText: artwork.title,
          },
        });
      }
      if (!artwork.orientation && stored[0]) {
        const { width, height } = stored[0];
        const ratio = width / height;
        const orientation = ratio > 2 ? 'PANORAMIC' : ratio > 1.1 ? 'LANDSCAPE' : ratio < 0.9 ? 'PORTRAIT' : 'SQUARE';
        await prisma.artwork.update({ where: { id: artwork.id }, data: { orientation } });
      }
      await refreshPrimary(artwork.id);
      await requeueIfApproved(artwork, ctx.user, 'Images changed — re-review required');
      await audit(ctx.user, 'ARTWORK_IMAGES_ADDED', 'Artwork', artwork.id, { count: stored.length }, { ip: ctx.ip });
      return created(await sellerDetail(artwork.id));
    },
  },
  {
    method: 'DELETE',
    path: '/artworks/:id/images/:imageId',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const artwork = await ownedArtwork(ctx.user, ctx.params.id);
      const image = await prisma.artworkImage.findFirst({ where: { id: ctx.params.imageId, artworkId: artwork.id } });
      if (!image) throw notFound('Image');
      await prisma.artworkImage.delete({ where: { id: image.id } });
      await Promise.all([storage.delete(image.storageKey, 'public'), storage.delete(thumbKeyFor(image.storageKey), 'public')]).catch(() => undefined);
      await refreshPrimary(artwork.id);
      await requeueIfApproved(artwork, ctx.user, 'Images changed — re-review required');
      return ok(await sellerDetail(artwork.id));
    },
  },
  {
    method: 'PATCH',
    path: '/artworks/:id/images/:imageId/primary',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      const artwork = await ownedArtwork(ctx.user, ctx.params.id);
      const image = await prisma.artworkImage.findFirst({ where: { id: ctx.params.imageId, artworkId: artwork.id } });
      if (!image) throw notFound('Image');
      await prisma.$transaction([
        prisma.artworkImage.updateMany({ where: { artworkId: artwork.id }, data: { isPrimary: false } }),
        prisma.artworkImage.update({ where: { id: image.id }, data: { isPrimary: true } }),
      ]);
      await refreshPrimary(artwork.id);
      return ok(await sellerDetail(artwork.id));
    },
  },
  {
    method: 'POST',
    path: '/artworks/:id/digital-file',
    roles: ['ARTIST'],
    upload: { field: 'file', maxCount: 1 },
    rateLimit: 'upload',
    handler: async (ctx) => {
      const artwork = await ownedArtwork(ctx.user, ctx.params.id);
      if (artwork.format !== 'DIGITAL') throw badRequest('Only DIGITAL artworks have a downloadable file');
      const file = ctx.files[0];
      if (!file) throw badRequest('Attach the deliverable in the "file" field');
      const { stored } = await storeOriginalImage(file, 'digitalArt', { minWidth: 600, minHeight: 600 });
      if (artwork.digitalFileKey) await storage.delete(artwork.digitalFileKey, 'private').catch(() => undefined);
      await prisma.artwork.update({ where: { id: artwork.id }, data: { digitalFileKey: stored.key } });
      await audit(ctx.user, 'ARTWORK_DIGITAL_FILE_UPLOADED', 'Artwork', artwork.id, { size: stored.size }, { ip: ctx.ip });
      return created({ id: artwork.id, hasDigitalFile: true });
    },
  },
  {
    method: 'POST',
    path: '/artworks/:id/submit',
    roles: ['ARTIST'],
    handler: async (ctx) => {
      requireArtist(ctx.user, { approved: true });
      const artwork = await ownedArtwork(ctx.user, ctx.params.id);
      if (!['DRAFT', 'REJECTED'].includes(artwork.status)) throw conflict(`Artwork in status ${artwork.status} cannot be submitted`);
      const images = await prisma.artworkImage.count({ where: { artworkId: artwork.id } });
      if (!images) throw badRequest('Upload at least one image before submitting');
      if (artwork.format === 'DIGITAL' && !artwork.digitalFileKey) throw badRequest('Upload the digital file before submitting');
      await prisma.artwork.update({ where: { id: artwork.id }, data: { status: 'PENDING_REVIEW' } });
      await recordStatus(artwork.id, artwork.status, 'PENDING_REVIEW', ctx.user, 'Submitted for review');
      const admins = await prisma.user.findMany({ where: { roles: { some: { role: { name: 'ADMIN' } } } }, select: { id: true } });
      if (admins.length) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: 'ARTWORK_PENDING',
            title: 'Artwork awaiting review',
            body: `"${artwork.title}" was submitted for review.`,
            link: '/admin/artworks',
          })),
        });
      }
      await audit(ctx.user, 'ARTWORK_SUBMITTED', 'Artwork', artwork.id, undefined, { ip: ctx.ip });
      return ok(await sellerDetail(artwork.id));
    },
  },
];

// ───────────────────────────── Public routes ─────────────────────────────

const detailSelect = {
  ...artworkCardSelect,
  description: true,
  yearCreated: true,
  widthCm: true,
  heightCm: true,
  depthCm: true,
  sku: true,
  licenseInfo: true,
  copyrightInfo: true,
  viewCount: true,
  publishedAt: true,
  categoryId: true,
  styleId: true,
  artistId: true,
  theme: { select: refSelect },
  tags: { select: { tag: { select: refSelect } } },
  images: {
    orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
    select: { id: true, url: true, thumbUrl: true, width: true, height: true, isPrimary: true, altText: true },
  },
  collectionItems: { where: { collection: { isPublished: true } }, select: { collection: { select: refSelect } } },
  artist: {
    select: {
      ...artistMiniSelect,
      followerCount: true,
      acceptsCustomArt: true,
      profile: { select: { bio: true } },
      gallery: { select: { name: true, slug: true } },
    },
  },
} satisfies Prisma.ArtworkSelect;

const publicRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/artworks',
    handler: async (ctx) => {
      const f = parse(artworkFilterSchema, ctx.query);
      const { total, data } = await listPublicArtworks(f);
      return ok(data, pageMeta(f.page, f.pageSize, total));
    },
  },
  {
    method: 'GET',
    path: '/artworks/:idOrSlug',
    auth: 'optional',
    handler: async (ctx) => {
      const key = ctx.params.idOrSlug;
      const a = await prisma.artwork.findFirst({
        where: { AND: [publicArtworkWhere, { OR: [{ id: key }, { slug: key }] }] },
        select: detailSelect,
      });
      if (!a) throw notFound('Artwork');

      await prisma.artwork.update({ where: { id: a.id }, data: { viewCount: { increment: 1 } } });
      if (ctx.user) {
        await prisma.recentlyViewedArtwork.upsert({
          where: { userId_artworkId: { userId: ctx.user.id, artworkId: a.id } },
          update: { viewedAt: new Date() },
          create: { userId: ctx.user.id, artworkId: a.id },
        });
      }
      const card = toArtworkCard({ ...a, images: a.images.filter((i) => i.isPrimary).slice(0, 1) });
      return ok({
        ...card,
        description: a.description,
        images: a.images,
        theme: a.theme,
        tags: a.tags.map((t) => t.tag),
        yearCreated: a.yearCreated,
        widthCm: money(a.widthCm),
        heightCm: money(a.heightCm),
        depthCm: money(a.depthCm),
        sku: a.sku,
        licenseInfo: a.licenseInfo,
        copyrightInfo: a.copyrightInfo,
        availableQuantity: availableQuantity(a),
        collections: a.collectionItems.map((c) => c.collection),
        artist: {
          id: a.artist.id,
          slug: a.artist.slug,
          displayName: a.artist.displayName,
          avatarUrl: a.artist.avatarUrl,
          bio: a.artist.profile?.bio ?? null,
          followerCount: a.artist.followerCount,
          acceptsCustomArt: a.artist.acceptsCustomArt,
          gallery: a.artist.gallery,
        },
        isWishlisted: await isWishlisted(ctx.user?.id, 'ARTWORK', a.id),
        viewCount: a.viewCount + 1,
        publishedAt: a.publishedAt,
      });
    },
  },
  {
    method: 'GET',
    path: '/artworks/:id/related',
    handler: async (ctx) => {
      const a = await prisma.artwork.findFirst({
        where: { AND: [publicArtworkWhere, { OR: [{ id: ctx.params.id }, { slug: ctx.params.id }] }] },
        select: { id: true, artistId: true, categoryId: true, styleId: true, mediumId: true },
      });
      if (!a) throw notFound('Artwork');
      const moreFromArtist = await findCards({ AND: [publicArtworkWhere, { artistId: a.artistId, id: { not: a.id } }] }, undefined, 8);
      const similarOr: Prisma.ArtworkWhereInput[] = [];
      if (a.styleId) similarOr.push({ styleId: a.styleId });
      if (a.categoryId) similarOr.push({ categoryId: a.categoryId });
      if (a.mediumId) similarOr.push({ mediumId: a.mediumId });
      const similar = similarOr.length
        ? await findCards(
            { AND: [publicArtworkWhere, { id: { not: a.id }, artistId: { not: a.artistId } }, { OR: similarOr }] },
            [{ salesCount: 'desc' }, { viewCount: 'desc' }],
            8,
          )
        : [];
      return ok({ moreFromArtist, similar });
    },
  },
];

export const artworkRoutes: RouteDef[] = [...sellerRoutes, ...publicRoutes];

import { prisma } from '../../database/prisma/client.js';
import { createSignedFileUrl } from '../../providers/storage/signed-url.js';
import { AppError, notFound } from '../../shared/errors.js';
import { ok, type RouteDef } from '../../shared/http.js';

const LINK_TTL_SECONDS = 60;

export const downloadRoutes: RouteDef[] = [
  {
    method: 'POST',
    path: '/downloads/:id/link',
    auth: 'required',
    rateLimit: 'strict',
    handler: async (ctx) => {
      const access = await prisma.downloadAccess.findFirst({
        where: { id: ctx.params.id, userId: ctx.user!.id },
        include: { orderItem: { select: { order: { select: { paymentStatus: true, status: true } } } } },
      });
      if (!access) throw notFound('Download');
      if (access.revokedAt || access.orderItem.order.status === 'CANCELLED') throw new AppError(410, 'DOWNLOAD_REVOKED', 'This download is no longer available');
      if (access.orderItem.order.paymentStatus !== 'PAID') throw new AppError(402, 'PAYMENT_REQUIRED', 'Payment has not been confirmed yet');
      if (access.expiresAt && access.expiresAt < new Date()) throw new AppError(410, 'DOWNLOAD_EXPIRED', 'This download link has expired');

      // Conditional increment: never exceeds the limit even with concurrent clicks.
      const res = await prisma.downloadAccess.updateMany({
        where: { id: access.id, downloadCount: { lt: access.maxDownloads } },
        data: { downloadCount: { increment: 1 } },
      });
      if (res.count !== 1) throw new AppError(429, 'DOWNLOAD_LIMIT', `Download limit of ${access.maxDownloads} reached`);
      await prisma.downloadLog.create({ data: { downloadAccessId: access.id, ipAddress: ctx.ip, userAgent: ctx.userAgent?.slice(0, 500) } });

      return ok({
        url: createSignedFileUrl(access.storageKey, ctx.user!.id, LINK_TTL_SECONDS),
        expiresInSeconds: LINK_TTL_SECONDS,
        remaining: access.maxDownloads - access.downloadCount - 1,
      });
    },
  },
];

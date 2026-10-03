import { prisma } from '../../database/prisma/client.js';
import { notFound } from '../../shared/errors.js';
import { ok, type RouteDef } from '../../shared/http.js';
import { pageMeta, pagination, parse } from '../../shared/validation.js';

export const notificationRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/notifications',
    auth: 'required',
    handler: async (ctx) => {
      const q = parse(pagination, ctx.query);
      const where = { userId: ctx.user!.id, ...(ctx.query.unread === 'true' ? { readAt: null } : {}) };
      const [total, rows] = await Promise.all([
        prisma.notification.count({ where }),
        prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      ]);
      return ok(rows, pageMeta(q.page, q.pageSize, total));
    },
  },
  {
    method: 'GET',
    path: '/notifications/unread-count',
    auth: 'required',
    handler: async (ctx) => ok({ count: await prisma.notification.count({ where: { userId: ctx.user!.id, readAt: null } }) }),
  },
  {
    method: 'PATCH',
    path: '/notifications/read-all',
    auth: 'required',
    handler: async (ctx) => {
      const { count } = await prisma.notification.updateMany({ where: { userId: ctx.user!.id, readAt: null }, data: { readAt: new Date() } });
      return ok({ updated: count });
    },
  },
  {
    method: 'PATCH',
    path: '/notifications/:id/read',
    auth: 'required',
    handler: async (ctx) => {
      const { count } = await prisma.notification.updateMany({
        where: { id: ctx.params.id, userId: ctx.user!.id },
        data: { readAt: new Date() },
      });
      if (!count) throw notFound('Notification');
      return ok({ id: ctx.params.id, read: true });
    },
  },
];

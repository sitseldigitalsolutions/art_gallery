import { z } from 'zod';
import { prisma } from '../../database/prisma/client.js';
import { audit } from '../../shared/audit.js';
import { conflict, notFound } from '../../shared/errors.js';
import { created, type RouteDef } from '../../shared/http.js';
import { parse } from '../../shared/validation.js';

const reportBody = z.object({
  targetType: z.enum(['ARTWORK', 'USER', 'ARTIST', 'REVIEW']),
  targetId: z.string().min(1).max(40),
  reason: z.enum(['INAPPROPRIATE', 'COPYRIGHT', 'SPAM', 'FRAUD', 'SELLER_VIOLATION', 'OTHER']),
  details: z.string().trim().max(5000).optional(),
});

async function targetExists(type: z.infer<typeof reportBody>['targetType'], id: string) {
  switch (type) {
    case 'ARTWORK':
      return prisma.artwork.count({ where: { id } });
    case 'USER':
      return prisma.user.count({ where: { id } });
    case 'ARTIST':
      return prisma.artist.count({ where: { id } });
    case 'REVIEW':
      return (await prisma.artworkReview.count({ where: { id } })) + (await prisma.artistReview.count({ where: { id } }));
  }
}

export const reportRoutes: RouteDef[] = [
  {
    method: 'POST',
    path: '/reports',
    auth: 'required',
    rateLimit: 'strict',
    handler: async (ctx) => {
      const input = parse(reportBody, ctx.body);
      if (!(await targetExists(input.targetType, input.targetId))) throw notFound(input.targetType.toLowerCase());
      const duplicate = await prisma.report.findFirst({
        where: { reporterId: ctx.user!.id, targetType: input.targetType, targetId: input.targetId, status: { in: ['OPEN', 'REVIEWING'] } },
      });
      if (duplicate) throw conflict('You already have an open report for this item');
      const report = await prisma.report.create({ data: { ...input, reporterId: ctx.user!.id } });
      const admins = await prisma.user.findMany({ where: { roles: { some: { role: { name: 'ADMIN' } } } }, select: { id: true } });
      if (admins.length) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: 'REPORT_FILED',
            title: `New ${input.reason.toLowerCase().replace('_', ' ')} report`,
            body: `A ${input.targetType.toLowerCase()} was reported.`,
            link: '/admin/reports',
          })),
        });
      }
      await audit(ctx.user, 'REPORT_FILED', 'Report', report.id, { targetType: input.targetType, reason: input.reason }, { ip: ctx.ip });
      return created({ id: report.id, status: report.status });
    },
  },
];

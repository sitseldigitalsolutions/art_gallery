import { prisma } from '../../database/prisma/client.js';
import { notify } from '../../shared/audit.js';
import { badRequest, notFound } from '../../shared/errors.js';
import { created, ok, type RouteDef } from '../../shared/http.js';
import { artistCardSelect, publicArtistWhere, toArtistCard } from '../../shared/serializers.js';

export const followRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/follows',
    auth: 'required',
    handler: async (ctx) => {
      const rows = await prisma.artistFollow.findMany({
        where: { userId: ctx.user!.id, artist: publicArtistWhere },
        orderBy: { createdAt: 'desc' },
        select: { artist: { select: artistCardSelect } },
      });
      return ok(rows.map((r) => toArtistCard(r.artist)));
    },
  },
  {
    method: 'POST',
    path: '/follows/:artistId',
    auth: 'required',
    handler: async (ctx) => {
      const artist = await prisma.artist.findFirst({
        where: { AND: [publicArtistWhere, { id: ctx.params.artistId }] },
        select: { id: true, userId: true },
      });
      if (!artist) throw notFound('Artist');
      if (artist.userId === ctx.user!.id) throw badRequest('You cannot follow yourself');
      const followerCount = await prisma.$transaction(async (tx) => {
        const existing = await tx.artistFollow.findUnique({ where: { userId_artistId: { userId: ctx.user!.id, artistId: artist.id } } });
        if (!existing) {
          await tx.artistFollow.create({ data: { userId: ctx.user!.id, artistId: artist.id } });
          const a = await tx.artist.update({ where: { id: artist.id }, data: { followerCount: { increment: 1 } }, select: { followerCount: true } });
          await notify(artist.userId, 'NEW_FOLLOWER', 'You have a new follower', `${ctx.user!.fullName} started following you.`, undefined, tx);
          return a.followerCount;
        }
        return (await tx.artist.findUniqueOrThrow({ where: { id: artist.id }, select: { followerCount: true } })).followerCount;
      });
      return created({ artistId: artist.id, following: true, followerCount });
    },
  },
  {
    method: 'DELETE',
    path: '/follows/:artistId',
    auth: 'required',
    handler: async (ctx) => {
      const artistId = ctx.params.artistId;
      const followerCount = await prisma.$transaction(async (tx) => {
        const { count } = await tx.artistFollow.deleteMany({ where: { userId: ctx.user!.id, artistId } });
        if (count) await tx.artist.updateMany({ where: { id: artistId, followerCount: { gte: count } }, data: { followerCount: { decrement: count } } });
        const a = await tx.artist.findUnique({ where: { id: artistId }, select: { followerCount: true } });
        return a?.followerCount ?? 0;
      });
      return ok({ artistId, following: false, followerCount });
    },
  },
];

import type { RoleName } from '@prisma/client';
import { prisma } from '../database/prisma/client.js';
import { verifyAccessToken } from '../modules/auth/tokens.js';
import type { AuthUser } from '../shared/http.js';

/**
 * Resolves the authenticated user from a Bearer token. The user, roles and artist
 * identity are always re-loaded from the database so suspensions take effect immediately
 * and no identity attribute is ever trusted from the client.
 */
export async function resolveUser(authorization: string | undefined): Promise<AuthUser | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  const userId = verifyAccessToken(authorization.slice(7).trim());
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      roles: { select: { role: { select: { name: true } } } },
      artist: { select: { id: true, status: true } },
    },
  });
  if (!user || user.status !== 'ACTIVE') return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles.map((r) => r.role.name as RoleName),
    artistId: user.artist?.id ?? null,
    artistStatus: user.artist?.status ?? null,
  };
}

export const isAdmin = (u: AuthUser | null) => !!u?.roles.includes('ADMIN');
export const hasRole = (u: AuthUser | null, roles: RoleName[]) => !!u && roles.some((r) => u.roles.includes(r));

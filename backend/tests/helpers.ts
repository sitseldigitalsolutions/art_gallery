import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import request from 'supertest';
import type { ArtistStatus, RoleName } from '@prisma/client';
import { createExpressApp } from '../src/adapters/express/app.js';
import { allRoutes } from '../src/bootstrap/routes.js';
import { prisma } from '../src/database/prisma/client.js';
import { signAccessToken } from '../src/modules/auth/tokens.js';

export const app = createExpressApp(allRoutes());
export const api = () => request(app);
export { prisma };

let seq = 0;
const uid = () => `${Date.now().toString(36)}${(seq++).toString(36)}`;
const PASSWORD_HASH = bcrypt.hashSync('Passw0rd!', 4);

let rolesReady: Promise<void> | null = null;

/** Memoised so concurrent createUser() calls don't race on the role upserts. */
export function ensureRoles() {
  rolesReady ??= (async () => {
    for (const name of ['ADMIN', 'ARTIST', 'CUSTOMER'] as RoleName[]) {
      await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
    }
  })();
  return rolesReady;
}

export interface TestUser {
  id: string;
  email: string;
  token: string;
  artistId: string | null;
  auth: { Authorization: string };
}

export async function createUser(role: RoleName = 'CUSTOMER', opts: { artistStatus?: ArtistStatus } = {}): Promise<TestUser> {
  await ensureRoles();
  const roles = role === 'ARTIST' ? ['ARTIST', 'CUSTOMER'] : [role];
  const roleRows = await prisma.role.findMany({ where: { name: { in: roles as RoleName[] } } });
  const email = `${role.toLowerCase()}-${uid()}@test.local`;
  const user = await prisma.user.create({
    data: {
      email,
      fullName: `${role} ${uid()}`,
      passwordHash: PASSWORD_HASH,
      roles: { create: roleRows.map((r) => ({ roleId: r.id })) },
      wishlists: { create: {} },
      ...(role === 'ARTIST'
        ? {
            artist: {
              create: {
                displayName: `Artist ${uid()}`,
                slug: `artist-${uid()}`,
                status: opts.artistStatus ?? 'APPROVED',
                profile: { create: { bio: 'Test artist' } },
                gallery: { create: { name: `Gallery ${uid()}`, slug: `gallery-${uid()}` } },
              },
            },
          }
        : {}),
    },
    include: { artist: true },
  });
  const token = signAccessToken(user.id);
  return { id: user.id, email, token, artistId: user.artist?.id ?? null, auth: { Authorization: `Bearer ${token}` } };
}

/** A real, decodable PNG for upload tests. */
export async function samplePng(width = 400, height = 400, color = '#8b2bd9') {
  return sharp({ create: { width, height, channels: 3, background: color } }).png().toBuffer();
}

export async function createArtwork(artistId: string, overrides: Record<string, unknown> = {}) {
  const id = uid();
  return prisma.artwork.create({
    data: {
      artistId,
      title: `Artwork ${id}`,
      slug: `artwork-${id}`,
      sku: `SKU-${id}`,
      type: 'ORIGINAL_PAINTING',
      format: 'ORIGINAL',
      status: 'APPROVED',
      price: 10000,
      publishedAt: new Date(),
      inventory: { create: { quantity: 1 } },
      images: { create: { url: 'http://localhost:4000/media/artworks/x.webp', storageKey: 'artworks/x.webp', isPrimary: true } },
      ...overrides,
    },
  });
}

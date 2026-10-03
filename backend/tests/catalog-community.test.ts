import { beforeAll, describe, expect, it } from 'vitest';
import { storage } from '../src/providers/storage/index.js';
import { createSignedFileUrl } from '../src/providers/storage/signed-url.js';
import { api, createArtwork, createUser, prisma, type TestUser } from './helpers.js';

let artistA: TestUser;
let artistB: TestUser;
let customer: TestUser;
let other: TestUser;
let admin: TestUser;
let artworkA: { id: string; slug: string };
let artworkB: { id: string };

beforeAll(async () => {
  // Sequential: concurrent role upserts in the shared helper race on the unique role name.
  artistA = await createUser('ARTIST');
  artistB = await createUser('ARTIST');
  customer = await createUser('CUSTOMER');
  other = await createUser('CUSTOMER');
  admin = await createUser('ADMIN');
  artworkA = await createArtwork(artistA.artistId!, { title: 'Community A' });
  artworkB = await createArtwork(artistB.artistId!, { title: 'Community B' });
});

describe('artist profiles', () => {
  it('routes /artists/me to the own profile (not the :slug route) and isolates dashboards', async () => {
    const me = await api().get('/api/v1/artists/me').set(artistA.auth);
    expect(me.status).toBe(200);
    expect(me.body.data.id).toBe(artistA.artistId);
    expect((await api().get('/api/v1/artists/me').set(customer.auth)).status).toBe(403);
    const dash = await api().get('/api/v1/artists/me/dashboard').set(artistA.auth);
    expect(dash.status).toBe(200);
    expect(dash.body.data.counts.approved).toBe(1);
  });

  it('updates own profile and exposes the public profile by slug', async () => {
    const res = await api().patch('/api/v1/artists/me').set(artistA.auth).send({ bio: 'Painter of quiet rivers', yearsOfExperience: 7, city: 'Pune' });
    expect(res.status).toBe(200);
    const pub = await api().get(`/api/v1/artists/${res.body.data.slug}`);
    expect(pub.body.data.bio).toBe('Painter of quiet rivers');
    expect(pub.body.data.city).toBe('Pune');
    expect(pub.body.data.featuredArtworks).toHaveLength(1);
    expect(pub.body.data.gallery).not.toBeNull();
  });

  it('hides non-approved artists publicly', async () => {
    const pending = await createUser('ARTIST', { artistStatus: 'PENDING_APPROVAL' });
    const row = await prisma.artist.findUniqueOrThrow({ where: { id: pending.artistId! } });
    expect((await api().get(`/api/v1/artists/${row.slug}`)).status).toBe(404);
    const list = await api().get('/api/v1/artists?pageSize=60');
    expect(list.body.data.find((a: { id: string }) => a.id === row.id)).toBeUndefined();
  });

  it('lists galleries and gallery detail', async () => {
    const list = await api().get('/api/v1/galleries');
    expect(list.status).toBe(200);
    const g = list.body.data.find((x: { artist: { id: string } }) => x.artist.id === artistA.artistId);
    const detail = await api().get(`/api/v1/galleries/${g.slug}`);
    expect(detail.body.data.artworks).toHaveLength(1);
    expect(detail.body.data.artist.id).toBe(artistA.artistId);
  });
});

describe('collections', () => {
  let collectionId: string;

  it('lets an artist create a collection from their own artworks only', async () => {
    const bad = await api().post('/api/v1/collections').set(artistB.auth).send({ name: 'Stolen', artworkIds: [artworkA.id] });
    expect(bad.status).toBe(404);
    const res = await api().post('/api/v1/collections').set(artistA.auth).send({ name: 'River Series', artworkIds: [artworkA.id] });
    expect(res.status).toBe(201);
    collectionId = res.body.data.id;
    expect(res.body.data.artworkCount).toBe(1);
  });

  it('prevents artist B from editing or adding to artist A collection, and A from adding B artwork', async () => {
    expect((await api().patch(`/api/v1/collections/${collectionId}`).set(artistB.auth).send({ name: 'Mine now' })).status).toBe(404);
    expect((await api().post(`/api/v1/collections/${collectionId}/items`).set(artistB.auth).send({ artworkId: artworkB.id })).status).toBe(404);
    expect((await api().post(`/api/v1/collections/${collectionId}/items`).set(artistA.auth).send({ artworkId: artworkB.id })).status).toBe(404);
    expect((await api().delete(`/api/v1/collections/${collectionId}`).set(artistB.auth)).status).toBe(404);
    expect((await api().post('/api/v1/collections').set(customer.auth).send({ name: 'Nope' })).status).toBe(403);
  });

  it('is publicly browsable and admins can curate platform collections', async () => {
    const pub = await api().get('/api/v1/collections');
    const card = pub.body.data.find((c: { id: string }) => c.id === collectionId);
    expect(card.previewImages.length).toBeGreaterThan(0);
    const detail = await api().get(`/api/v1/collections/${card.slug}`);
    expect(detail.body.data.artworks[0].id).toBe(artworkA.id);
    const curated = await api()
      .post('/api/v1/collections')
      .set(admin.auth)
      .send({ name: 'Editors Picks', isFeatured: true, artworkIds: [artworkA.id, artworkB.id] });
    expect(curated.status).toBe(201);
    expect(curated.body.data.artist).toBeNull();
    expect(curated.body.data.isFeatured).toBe(true);
  });
});

describe('wishlist and follows', () => {
  it('keeps the artwork wishlist counter consistent and is idempotent', async () => {
    const body = { itemType: 'ARTWORK', targetId: artworkA.id };
    expect((await api().post('/api/v1/wishlist').set(customer.auth).send(body)).status).toBe(201);
    expect((await api().post('/api/v1/wishlist').set(customer.auth).send(body)).status).toBe(201);
    await api().post('/api/v1/wishlist').set(other.auth).send(body);
    let row = await prisma.artwork.findUniqueOrThrow({ where: { id: artworkA.id } });
    expect(row.wishlistCount).toBe(2);
    const ids = await api().get('/api/v1/wishlist/ids').set(customer.auth);
    expect(ids.body.data.ARTWORK).toEqual([artworkA.id]);
    const list = await api().get('/api/v1/wishlist').set(customer.auth);
    expect(list.body.data.artworks[0].id).toBe(artworkA.id);
    const detail = await api().get(`/api/v1/artworks/${artworkA.slug}`).set(customer.auth);
    expect(detail.body.data.isWishlisted).toBe(true);
    await api().delete(`/api/v1/wishlist/ARTWORK/${artworkA.id}`).set(customer.auth);
    await api().delete(`/api/v1/wishlist/ARTWORK/${artworkA.id}`).set(customer.auth);
    row = await prisma.artwork.findUniqueOrThrow({ where: { id: artworkA.id } });
    expect(row.wishlistCount).toBe(1);
    expect((await api().post('/api/v1/wishlist').set(customer.auth).send({ itemType: 'ARTWORK', targetId: 'missing' })).status).toBe(404);
    expect((await api().get('/api/v1/wishlist')).status).toBe(401);
  });

  it('follows/unfollows with an accurate follower count and notifies the artist', async () => {
    const f1 = await api().post(`/api/v1/follows/${artistA.artistId}`).set(customer.auth);
    expect(f1.body.data.followerCount).toBe(1);
    const again = await api().post(`/api/v1/follows/${artistA.artistId}`).set(customer.auth);
    expect(again.body.data.followerCount).toBe(1);
    expect((await api().get('/api/v1/follows').set(customer.auth)).body.data[0].id).toBe(artistA.artistId);
    expect((await api().post(`/api/v1/follows/${artistA.artistId}`).set(artistA.auth)).status).toBe(400);
    const unread = await api().get('/api/v1/notifications/unread-count').set(artistA.auth);
    expect(unread.body.data.count).toBeGreaterThan(0);
    const un = await api().delete(`/api/v1/follows/${artistA.artistId}`).set(customer.auth);
    expect(un.body.data.followerCount).toBe(0);
    await api().delete(`/api/v1/follows/${artistA.artistId}`).set(customer.auth);
    expect((await prisma.artist.findUniqueOrThrow({ where: { id: artistA.artistId! } })).followerCount).toBe(0);
  });
});

describe('reviews', () => {
  it('requires a received purchase and recomputes rating', async () => {
    const denied = await api().post(`/api/v1/reviews/artwork/${artworkA.id}`).set(other.auth).send({ rating: 5, body: 'Lovely' });
    expect(denied.status).toBe(403);

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-T-${Date.now()}`,
        customerId: other.id,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'COD',
        subtotal: 10000,
        total: 10000,
        items: {
          create: {
            artistId: artistA.artistId!,
            artworkId: artworkA.id,
            titleSnapshot: 'Community A',
            format: 'ORIGINAL',
            fulfillmentType: 'PHYSICAL',
            fulfillmentStatus: 'DELIVERED',
            unitPrice: 10000,
            quantity: 1,
            lineTotal: 10000,
            commissionRate: 10,
            commissionAmount: 1000,
            artistAmount: 9000,
          },
        },
      },
    });
    expect(order.id).toBeTruthy();
    const okRes = await api().post(`/api/v1/reviews/artwork/${artworkA.id}`).set(other.auth).send({ rating: 4, body: 'Lovely texture' });
    expect(okRes.status).toBe(201);
    expect(okRes.body.data.verifiedPurchase).toBe(true);
    expect((await api().post(`/api/v1/reviews/artwork/${artworkA.id}`).set(other.auth).send({ rating: 5 })).status).toBe(409);
    const list = await api().get(`/api/v1/reviews/artwork/${artworkA.id}`);
    expect(list.body.meta.summary.average).toBe(4);
    expect(Number((await prisma.artwork.findUniqueOrThrow({ where: { id: artworkA.id } })).ratingAverage)).toBe(4);

    const artistReview = await api().post(`/api/v1/reviews/artist/${artistA.artistId}`).set(other.auth).send({ rating: 5, body: 'Great to work with' });
    expect(artistReview.status).toBe(201);
    expect((await api().post(`/api/v1/reviews/artist/${artistB.artistId}`).set(other.auth).send({ rating: 5 })).status).toBe(403);
  });
});

describe('users, notifications and reports', () => {
  it('manages addresses scoped to the owner', async () => {
    const addr = { fullName: 'Asha Rao', phone: '9876543210', line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001' };
    const a1 = await api().post('/api/v1/users/me/addresses').set(customer.auth).send(addr);
    expect(a1.body.data.isDefault).toBe(true);
    const a2 = await api().post('/api/v1/users/me/addresses').set(customer.auth).send({ ...addr, isDefault: true });
    const list = await api().get('/api/v1/users/me/addresses').set(customer.auth);
    expect(list.body.data[0].id).toBe(a2.body.data.id);
    expect(list.body.data.filter((x: { isDefault: boolean }) => x.isDefault)).toHaveLength(1);
    expect((await api().patch(`/api/v1/users/me/addresses/${a1.body.data.id}`).set(other.auth).send({ city: 'X' })).status).toBe(404);
    expect((await api().delete(`/api/v1/users/me/addresses/${a1.body.data.id}`).set(other.auth)).status).toBe(404);
  });

  it('marks only own notifications as read', async () => {
    const n = await prisma.notification.create({ data: { userId: customer.id, type: 'TEST', title: 'Hello' } });
    expect((await api().patch(`/api/v1/notifications/${n.id}/read`).set(other.auth)).status).toBe(404);
    expect((await api().patch(`/api/v1/notifications/${n.id}/read`).set(customer.auth)).status).toBe(200);
  });

  it('files reports and blocks duplicates', async () => {
    const body = { targetType: 'ARTWORK', targetId: artworkB.id, reason: 'COPYRIGHT', details: 'Copied from my portfolio' };
    expect((await api().post('/api/v1/reports').set(customer.auth).send(body)).status).toBe(201);
    expect((await api().post('/api/v1/reports').set(customer.auth).send(body)).status).toBe(409);
  });
});

describe('signed private file URLs', () => {
  let url: URL;

  beforeAll(async () => {
    const stored = await storage.put('customArtSource', 'secret-test.jpg', Buffer.from('private-bytes'), 'image/jpeg');
    url = new URL(createSignedFileUrl(stored.key, customer.id, 60));
  });

  const fetchPath = (u: URL) => api().get(u.pathname + u.search);

  it('streams the file for a valid signature', async () => {
    const res = await fetchPath(url);
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toMatch(/private/);
  });

  it('rejects tampered key, user, signature and expired links', async () => {
    const tamper = (k: string, v: string) => {
      const u = new URL(url.toString());
      u.searchParams.set(k, v);
      return u;
    };
    expect((await fetchPath(tamper('k', Buffer.from('custom-art/source/other.jpg').toString('base64url')))).status).toBe(403);
    expect((await fetchPath(tamper('u', 'someone-else'))).status).toBe(403);
    expect((await fetchPath(tamper('sig', 'x'.repeat(43)))).status).toBe(403);
    expect((await fetchPath(tamper('exp', String(Math.floor(Date.now() / 1000) - 10)))).status).toBe(403);
    const expired = new URL(createSignedFileUrl('custom-art/source/secret-test.jpg', customer.id, -5));
    expect((await fetchPath(expired)).status).toBe(403);
  });

  it('never serves private files from the public media path', async () => {
    expect((await api().get('/media/custom-art/source/secret-test.jpg')).status).toBe(404);
    expect((await api().get('/media/../private/custom-art/source/secret-test.jpg')).status).toBe(404);
  });
});

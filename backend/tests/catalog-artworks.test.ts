import { beforeAll, describe, expect, it } from 'vitest';
import { api, createArtwork, createUser, prisma, samplePng, type TestUser } from './helpers.js';

let artistA: TestUser;
let artistB: TestUser;
let pending: TestUser;
let customer: TestUser;
let admin: TestUser;
let categoryId: string;
let styleId: string;

const draftBody = (extra: Record<string, unknown> = {}) => ({
  title: 'Monsoon Over Kerala',
  description: 'Layered greens and silver rain',
  type: 'ORIGINAL_PAINTING',
  format: 'ORIGINAL',
  price: 12500,
  categoryId,
  styleId,
  tags: ['monsoon', 'landscape'],
  widthCm: 60,
  heightCm: 45,
  ...extra,
});

beforeAll(async () => {
  // Sequential: concurrent role upserts in the shared helper race on the unique role name.
  artistA = await createUser('ARTIST');
  artistB = await createUser('ARTIST');
  pending = await createUser('ARTIST', { artistStatus: 'PENDING_APPROVAL' });
  customer = await createUser('CUSTOMER');
  admin = await createUser('ADMIN');
  const cat = await prisma.artworkCategory.create({ data: { name: 'Landscape Test', slug: 'landscape-test' } });
  const style = await prisma.artworkStyle.create({ data: { name: 'Watercolor Test', slug: 'watercolor-test' } });
  categoryId = cat.id;
  styleId = style.id;
});

describe('artwork management (seller)', () => {
  let artworkId: string;

  it('creates a DRAFT artwork with tags, inventory and approval history', async () => {
    const res = await api().post('/api/v1/artworks').set(artistA.auth).send(draftBody());
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.tags.map((t: { slug: string }) => t.slug).sort()).toEqual(['landscape', 'monsoon']);
    expect(res.body.data.quantity).toBe(1);
    expect(res.body.data).not.toHaveProperty('digitalFileKey');
    artworkId = res.body.data.id;
    expect(await prisma.artworkApproval.count({ where: { artworkId } })).toBe(1);
  });

  it('ignores a client-supplied artistId (identity comes from the session)', async () => {
    const res = await api().post('/api/v1/artworks').set(artistA.auth).send(draftBody({ artistId: artistB.artistId }));
    expect(res.status).toBe(201);
    const row = await prisma.artwork.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(row.artistId).toBe(artistA.artistId);
  });

  it('rejects customers and unknown taxonomy', async () => {
    expect((await api().post('/api/v1/artworks').set(customer.auth).send(draftBody())).status).toBe(403);
    expect((await api().post('/api/v1/artworks').set(artistA.auth).send(draftBody({ categoryId: 'nope' }))).status).toBe(400);
  });

  it('isolates sellers: artist B gets 404 on artist A artwork for read, edit, delete, images and submit', async () => {
    const paths: Array<[string, string, Record<string, unknown>?]> = [
      ['get', `/api/v1/artists/me/artworks/${artworkId}`],
      ['patch', `/api/v1/artworks/${artworkId}`, { title: 'Hijacked title' }],
      ['delete', `/api/v1/artworks/${artworkId}`],
      ['post', `/api/v1/artworks/${artworkId}/submit`],
    ];
    for (const [method, path, body] of paths) {
      const req = (api() as unknown as Record<string, (p: string) => import('supertest').Test>)[method](path).set(artistB.auth);
      const res = body ? await req.send(body) : await req;
      expect(res.status, `${method} ${path}`).toBe(404);
    }
    const img = await api().post(`/api/v1/artworks/${artworkId}/images`).set(artistB.auth).attach('images', await samplePng(), 'a.png');
    expect(img.status).toBe(404);
    const list = await api().get('/api/v1/artists/me/artworks').set(artistB.auth);
    expect(list.body.data.find((a: { id: string }) => a.id === artworkId)).toBeUndefined();
    const row = await prisma.artwork.findUniqueOrThrow({ where: { id: artworkId } });
    expect(row.title).toBe('Monsoon Over Kerala');
    expect(row.status).toBe('DRAFT');
  });

  it('refuses submission without an image', async () => {
    const res = await api().post(`/api/v1/artworks/${artworkId}/submit`).set(artistA.auth);
    expect(res.status).toBe(400);
  });

  it('validates uploads by content: rejects renamed non-images and too-small images', async () => {
    const fake = await api()
      .post(`/api/v1/artworks/${artworkId}/images`)
      .set(artistA.auth)
      .attach('images', Buffer.from('<?php system($_GET["c"]); ?>'.padEnd(2000, ' ')), { filename: 'evil.png', contentType: 'image/png' });
    expect(fake.status).toBe(400);
    const gif = await api()
      .post(`/api/v1/artworks/${artworkId}/images`)
      .set(artistA.auth)
      .attach('images', Buffer.from('GIF89a'), { filename: 'x.gif', contentType: 'image/gif' });
    expect(gif.status).toBe(400);
    const tiny = await api()
      .post(`/api/v1/artworks/${artworkId}/images`)
      .set(artistA.auth)
      .attach('images', await samplePng(100, 100), { filename: 'tiny.png', contentType: 'image/png' });
    expect(tiny.status).toBe(400);
    expect(await prisma.artworkImage.count({ where: { artworkId } })).toBe(0);
  });

  it('uploads images (re-encoded to webp), sets primary + thumbnail, then submits for review', async () => {
    const res = await api()
      .post(`/api/v1/artworks/${artworkId}/images`)
      .set(artistA.auth)
      .attach('images', await samplePng(800, 600), { filename: 'one.png', contentType: 'image/png' })
      .attach('images', await samplePng(600, 800, '#123456'), { filename: 'two.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.data.images).toHaveLength(2);
    expect(res.body.data.images[0].isPrimary).toBe(true);
    expect(res.body.data.images[0].url).toMatch(/\.webp$/);
    expect(res.body.data.thumbnailUrl).toMatch(/-thumb\.webp$/);
    expect(res.body.data.orientation).toBe('LANDSCAPE');

    const second = res.body.data.images[1].id;
    const primary = await api().patch(`/api/v1/artworks/${artworkId}/images/${second}/primary`).set(artistA.auth);
    expect(primary.body.data.images[0].id).toBe(second);

    const submit = await api().post(`/api/v1/artworks/${artworkId}/submit`).set(artistA.auth);
    expect(submit.status).toBe(200);
    expect(submit.body.data.status).toBe('PENDING_REVIEW');
  });

  it('only approved artists may submit; pending artists may still create drafts', async () => {
    const draft = await api().post('/api/v1/artworks').set(pending.auth).send(draftBody());
    expect(draft.status).toBe(201);
    await prisma.artworkImage.create({ data: { artworkId: draft.body.data.id, url: 'u', storageKey: 'artworks/u.webp', isPrimary: true } });
    expect((await api().post(`/api/v1/artworks/${draft.body.data.id}/submit`).set(pending.auth)).status).toBe(403);
  });

  it('sends an approved artwork back to review when its content changes, but not for price', async () => {
    await prisma.artwork.update({ where: { id: artworkId }, data: { status: 'APPROVED', publishedAt: new Date() } });
    const price = await api().patch(`/api/v1/artworks/${artworkId}`).set(artistA.auth).send({ price: 13000 });
    expect(price.body.data.status).toBe('APPROVED');
    const title = await api().patch(`/api/v1/artworks/${artworkId}`).set(artistA.auth).send({ title: 'Monsoon Over Kerala II' });
    expect(title.body.data.status).toBe('PENDING_REVIEW');
    const bad = await api().patch(`/api/v1/artworks/${artworkId}`).set(artistA.auth).send({ discountPrice: 20000 });
    expect(bad.status).toBe(400);
  });

  it('archives on delete and never exposes the digital file key', async () => {
    const digital = await api()
      .post('/api/v1/artworks')
      .set(artistA.auth)
      .send(draftBody({ title: 'Neon Koi', format: 'DIGITAL', type: 'DIGITAL_ART' }));
    const id = digital.body.data.id;
    const up = await api()
      .post(`/api/v1/artworks/${id}/digital-file`)
      .set(artistA.auth)
      .attach('file', await samplePng(1200, 1200), { filename: 'koi.png', contentType: 'image/png' });
    expect(up.status).toBe(201);
    const detail = await api().get(`/api/v1/artists/me/artworks/${id}`).set(artistA.auth);
    expect(detail.body.data.hasDigitalFile).toBe(true);
    expect(JSON.stringify(detail.body)).not.toContain('digital-art/');
    const del = await api().delete(`/api/v1/artworks/${id}`).set(artistA.auth);
    expect(del.body.data.status).toBe('ARCHIVED');
  });
});

describe('public discovery', () => {
  let visibleSlug: string;

  beforeAll(async () => {
    const cat = await prisma.artworkCategory.create({ data: { name: 'Discovery Cat', slug: 'discovery-cat' } });
    const visible = await createArtwork(artistB.artistId!, {
      title: 'Saffron Dusk Discovery',
      categoryId: cat.id,
      price: 5000,
      widthCm: 30,
      heightCm: 30,
      dominantColor: 'orange',
      isFeatured: true,
    });
    visibleSlug = visible.slug;
    await createArtwork(artistB.artistId!, { title: 'Hidden Draft Discovery', status: 'DRAFT', categoryId: cat.id });
    await createArtwork(artistB.artistId!, { title: 'Hidden Pending Discovery', status: 'PENDING_REVIEW', categoryId: cat.id });
    await createArtwork(artistB.artistId!, { title: 'Expensive Discovery', categoryId: cat.id, price: 90000, widthCm: 120, heightCm: 100 });
    const suspended = await createUser('ARTIST', { artistStatus: 'SUSPENDED' });
    await createArtwork(suspended.artistId!, { title: 'Suspended Artist Discovery', categoryId: cat.id });
  });

  it('lists only approved artworks of approved artists', async () => {
    const res = await api().get('/api/v1/artworks?q=Discovery&pageSize=60');
    expect(res.status).toBe(200);
    const titles = res.body.data.map((a: { title: string }) => a.title).sort();
    expect(titles).toEqual(['Expensive Discovery', 'Saffron Dusk Discovery']);
    expect(res.body.meta.total).toBe(2);
  });

  it('filters by category, price, size, color, featured and sorts by price', async () => {
    const byCat = await api().get('/api/v1/artworks?category=discovery-cat&sort=price_desc');
    expect(byCat.body.data.map((a: { title: string }) => a.title)).toEqual(['Expensive Discovery', 'Saffron Dusk Discovery']);
    const cheap = await api().get('/api/v1/artworks?category=discovery-cat&maxPrice=10000');
    expect(cheap.body.data).toHaveLength(1);
    const large = await api().get('/api/v1/artworks?category=discovery-cat&size=large');
    expect(large.body.data.map((a: { title: string }) => a.title)).toEqual(['Expensive Discovery']);
    const orange = await api().get('/api/v1/artworks?color=orange&q=Discovery');
    expect(orange.body.data).toHaveLength(1);
    const featured = await api().get('/api/v1/artworks?featured=true&q=Discovery');
    expect(featured.body.data[0].isFeatured).toBe(true);
    expect((await api().get('/api/v1/artworks?sort=bogus')).status).toBe(400);
  });

  it('searches by artist name and returns contract-shaped cards', async () => {
    const artist = await prisma.artist.findUniqueOrThrow({ where: { id: artistB.artistId! } });
    const res = await api().get(`/api/v1/artworks?q=${encodeURIComponent(artist.displayName)}`);
    const card = res.body.data[0];
    for (const key of ['id', 'slug', 'title', 'price', 'imageUrl', 'thumbnailUrl', 'artist', 'available', 'ratingAverage']) {
      expect(card).toHaveProperty(key);
    }
    expect(typeof card.price).toBe('number');
  });

  it('returns detail by slug, records a view, and 404s hidden artworks', async () => {
    const res = await api().get(`/api/v1/artworks/${visibleSlug}`).set(customer.auth);
    expect(res.status).toBe(200);
    expect(res.body.data.isWishlisted).toBe(false);
    expect(await prisma.recentlyViewedArtwork.count({ where: { userId: customer.id } })).toBe(1);
    const hidden = await prisma.artwork.findFirstOrThrow({ where: { title: 'Hidden Draft Discovery' } });
    expect((await api().get(`/api/v1/artworks/${hidden.slug}`)).status).toBe(404);
    const related = await api().get(`/api/v1/artworks/${visibleSlug}/related`);
    expect(related.body.data).toHaveProperty('moreFromArtist');
    expect(related.body.data).toHaveProperty('similar');
  });

  it('serves search suggestions and the home payload from real data', async () => {
    const s = await api().get('/api/v1/search/suggest?q=Saffron');
    expect(s.body.data.artworks[0].title).toBe('Saffron Dusk Discovery');
    const home = await api().get('/api/v1/home');
    expect(home.status).toBe(200);
    for (const key of ['banners', 'featuredArtworks', 'trendingArtworks', 'newArtworks', 'featuredArtists', 'categories', 'stats', 'testimonials']) {
      expect(home.body.data).toHaveProperty(key);
    }
    expect(home.body.data.stats.artworks).toBeGreaterThan(0);
  });
});

describe('taxonomy administration', () => {
  it('is public to read but admin-only to change', async () => {
    expect((await api().get('/api/v1/categories')).status).toBe(200);
    expect((await api().post('/api/v1/categories').send({ name: 'Anon' })).status).toBe(401);
    expect((await api().post('/api/v1/categories').set(customer.auth).send({ name: 'Customer Cat' })).status).toBe(403);
    expect((await api().post('/api/v1/styles').set(artistA.auth).send({ name: 'Artist Style' })).status).toBe(403);
    const made = await api().post('/api/v1/mediums').set(admin.auth).send({ name: 'Gouache Test' });
    expect(made.status).toBe(201);
    expect(made.body.data.slug).toBe('gouache-test');
    const patched = await api().patch(`/api/v1/mediums/${made.body.data.id}`).set(admin.auth).send({ name: 'Gouache Paint' });
    expect(patched.body.data.name).toBe('Gouache Paint');
    const del = await api().delete(`/api/v1/mediums/${made.body.data.id}`).set(admin.auth);
    expect(del.body.data.deleted).toBe(true);
  });

  it('deactivates instead of deleting a category in use', async () => {
    const del = await api().delete(`/api/v1/categories/${categoryId}`).set(admin.auth);
    expect(del.body.data.deactivated).toBe(true);
    const list = await api().get('/api/v1/categories');
    expect(list.body.data.find((c: { id: string }) => c.id === categoryId)).toBeUndefined();
    expect(await prisma.auditLog.count({ where: { entityId: categoryId } })).toBeGreaterThan(0);
  });
});

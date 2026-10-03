import { beforeAll, describe, expect, it } from 'vitest';
import { api, createUser, prisma, samplePng, type TestUser } from './helpers.js';

const relative = (url: string) => url.replace('http://localhost:4000', '');

describe('custom photo-to-art workflow', () => {
  let customer: TestUser;
  let artist: TestUser;
  let otherArtist: TestUser;
  let admin: TestUser;
  let styleId: string;
  let requestId: string;
  let png: Buffer;

  beforeAll(async () => {
    customer = await createUser('CUSTOMER');
    artist = await createUser('ARTIST');
    otherArtist = await createUser('ARTIST');
    admin = await createUser('ADMIN');
    const style = await prisma.artworkStyle.create({ data: { name: `Watercolor ${Date.now()}`, slug: `watercolor-${Date.now()}` } });
    styleId = style.id;
    png = await samplePng(600, 500, '#ff6600');
  });

  const base = '/api/v1/custom-art/requests';

  it('lists artists accepting custom art', async () => {
    const res = await api().get(`/api/v1/custom-art/artists?styleId=${styleId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((a: { id: string }) => a.id === artist.artistId)).toBe(true);
  });

  it('rejects requests without a photo or with a fake image', async () => {
    const noPhoto = await api().post(base).set(customer.auth).field('artistId', artist.artistId!).field('styleId', styleId).field('instructions', 'Please paint this nicely');
    expect(noPhoto.status).toBe(400);
    const fake = await api()
      .post(base)
      .set(customer.auth)
      .field('artistId', artist.artistId!)
      .field('styleId', styleId)
      .field('instructions', 'Please paint this nicely')
      .attach('photos', Buffer.from('<script>alert(1)</script>'), { filename: 'evil.png', contentType: 'image/png' });
    expect(fake.status).toBe(400);
  });

  it('creates a request with a private, EXIF-stripped source photo', async () => {
    const res = await api()
      .post(base)
      .set(customer.auth)
      .field('artistId', artist.artistId!)
      .field('styleId', styleId)
      .field('instructions', 'Convert this family photo into a watercolor painting with a temple background.')
      .field('requestedFormat', 'DIGITAL')
      .field('budget', '4000')
      .field('options', JSON.stringify({ background: 'Temple', colors: 'Warm', 'bad key!': 'x' }))
      .attach('photos', png, { filename: 'family.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('REQUESTED');
    expect(res.body.data.options).toEqual({ background: 'Temple', colors: 'Warm' });
    expect(res.body.data.sourceThumbUrl).toContain('/api/v1/files/private?');
    requestId = res.body.data.id;
  });

  it('never serves the source photo publicly and rejects tampered signatures', async () => {
    const img = await prisma.customArtImage.findFirstOrThrow({ where: { requestId, kind: 'SOURCE' } });
    expect((await api().get(`/media/${img.storageKey}`)).status).toBe(404);

    const detail = await api().get(`${base}/${requestId}`).set(customer.auth);
    const url = relative(detail.body.data.sourceThumbUrl);
    const good = await api().get(url);
    expect(good.status).toBe(200);
    expect(good.headers['content-type']).toContain('image/webp');

    const tampered = url.replace(/sig=([^&]+)/, (_m, s: string) => `sig=${s.slice(0, -2)}xx`);
    expect([401, 403, 404]).toContain((await api().get(tampered)).status);
    const otherKey = url.replace(/k=([^&]+)/, `k=${Buffer.from('custom-art/source/other.webp').toString('base64url')}`);
    expect([401, 403, 404]).toContain((await api().get(otherKey)).status);
  });

  it('hides the request from unrelated artists and blocks wrong-party transitions', async () => {
    expect((await api().get(`${base}/${requestId}`).set(otherArtist.auth)).status).toBe(404);
    expect((await api().patch(`${base}/${requestId}/accept`).set(otherArtist.auth).send({ quotedPrice: 100 })).status).toBe(404);
    const byCustomer = await api().patch(`${base}/${requestId}/accept`).set(customer.auth).send({ quotedPrice: 100 });
    expect(byCustomer.status).toBe(409);
    const list = await api().get(`${base}?as=artist`).set(otherArtist.auth);
    expect(list.body.data.find((r: { id: string }) => r.id === requestId)).toBeUndefined();
    expect((await api().get(`${base}?as=admin`).set(customer.auth)).status).toBe(403);
  });

  it('runs review → accept → start → preview → revision (limited) → approve', async () => {
    expect((await api().patch(`${base}/${requestId}/review`).set(artist.auth)).body.data.status).toBe('ARTIST_REVIEWING');
    expect((await api().patch(`${base}/${requestId}/accept`).set(artist.auth).send({ quotedPrice: 0 })).status).toBe(400);
    const accepted = await api().patch(`${base}/${requestId}/accept`).set(artist.auth).send({ quotedPrice: 5000, artistMessage: 'Happy to paint this!' });
    expect(accepted.body.data.status).toBe('ACCEPTED');
    expect(accepted.body.data.quotedPrice).toBe(5000);
    expect((await api().patch(`${base}/${requestId}/start`).set(artist.auth).send({})).body.data.status).toBe('IN_PROGRESS');

    const preview = () => api().post(`${base}/${requestId}/preview`).set(artist.auth).field('message', 'First draft').attach('images', png, { filename: 'p.png', contentType: 'image/png' });
    expect((await preview()).body.data.status).toBe('PREVIEW_READY');

    for (let i = 1; i <= 2; i++) {
      const rev = await api().post(`${base}/${requestId}/revision`).set(customer.auth).send({ feedback: `Revision ${i}: warmer colours` });
      expect(rev.status).toBe(200);
      expect(rev.body.data.revisionCount).toBe(i);
      expect((await preview()).body.data.status).toBe('PREVIEW_READY');
    }
    const third = await api().post(`${base}/${requestId}/revision`).set(customer.auth).send({ feedback: 'One more change please' });
    expect(third.status).toBe(409);
    expect(third.body.error.code).toBe('REVISION_LIMIT');

    const approved = await api().patch(`${base}/${requestId}/approve`).set(customer.auth).send({ message: 'Love it' });
    expect(approved.body.data.status).toBe('CUSTOMER_APPROVED');
    expect(approved.body.data.allowedActions).toContain('addToCart');
    expect(approved.body.data.revisions).toHaveLength(2);
  });

  it('requires an order before the final upload, then completes and grants the download once paid', async () => {
    const early = await api().post(`${base}/${requestId}/final`).set(artist.auth).attach('images', png, { filename: 'f.png', contentType: 'image/png' });
    expect(early.status).toBe(409);

    expect((await api().post('/api/v1/cart/items').set(customer.auth).send({ customArtRequestId: requestId })).status).toBe(201);
    const cod = await api().post('/api/v1/orders/checkout').set(customer.auth).send({ paymentMethod: 'COD' });
    expect(cod.status).toBe(400);
    const order = await api().post('/api/v1/orders/checkout').set(customer.auth).send({ paymentMethod: 'MANUAL' });
    expect(order.status).toBe(201);
    expect(order.body.data.total).toBe(5000);
    expect(order.body.data.paymentStatus).toBe('AWAITING_CONFIRMATION');

    const final = await api().post(`${base}/${requestId}/final`).set(artist.auth).field('message', 'Done!').attach('images', png, { filename: 'final.png', contentType: 'image/png' });
    expect(final.body.data.status).toBe('FINALIZING');

    // Digital deliverable stays hidden from the customer until payment is confirmed.
    const beforePay = await api().get(`${base}/${requestId}`).set(customer.auth);
    expect(beforePay.body.data.images.some((i: { kind: string }) => i.kind === 'FINAL')).toBe(false);

    const done = await api().patch(`${base}/${requestId}/complete`).set(customer.auth);
    expect(done.body.data.status).toBe('COMPLETED');
    expect(done.body.data.statusHistory.length).toBeGreaterThanOrEqual(12);

    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.body.data.id } });
    expect((await api().patch(`/api/v1/admin/payments/${payment.id}/confirm`).set(admin.auth).send({ reference: 'UPI-123' })).status).toBe(200);
    const afterPay = await api().get(`${base}/${requestId}`).set(customer.auth);
    expect(afterPay.body.data.images.some((i: { kind: string }) => i.kind === 'FINAL')).toBe(true);
    const orderDetail = await api().get(`/api/v1/orders/${order.body.data.id}`).set(customer.auth);
    expect(orderDetail.body.data.downloads).toHaveLength(1);

    const commission = await prisma.commission.findFirstOrThrow({ where: { orderItem: { customArtRequestId: requestId } } });
    expect(commission.ruleScope).toBe('GLOBAL');
    expect(Number(commission.amount)).toBe(500);
  });

  it('lets the customer cancel an unstarted request but not an unrelated user', async () => {
    const res = await api()
      .post(base)
      .set(customer.auth)
      .field('artistId', artist.artistId!)
      .field('styleId', styleId)
      .field('instructions', 'A second request for a pencil sketch')
      .attach('photos', png, { filename: 'a.png', contentType: 'image/png' });
    const id = res.body.data.id;
    expect((await api().patch(`${base}/${id}/cancel`).set(otherArtist.auth).send({ reason: 'nope' })).status).toBe(404);
    const cancelled = await api().patch(`${base}/${id}/cancel`).set(customer.auth).send({ reason: 'Changed my mind' });
    expect(cancelled.body.data.status).toBe('CANCELLED');
    expect((await api().patch(`${base}/${id}/accept`).set(artist.auth).send({ quotedPrice: 10 })).status).toBe(409);
  });
});

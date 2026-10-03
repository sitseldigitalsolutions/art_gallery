import { beforeAll, describe, expect, it } from 'vitest';
import { api, createArtwork, createUser, prisma, type TestUser } from './helpers.js';

const address = { fullName: 'Asha Rao', phone: '9876543210', line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'IN' };

describe('cart, checkout, commission, ledger, downloads & settlements', () => {
  let customer: TestUser;
  let customer2: TestUser;
  let artistA: TestUser;
  let artistB: TestUser;
  let admin: TestUser;

  beforeAll(async () => {
    customer = await createUser('CUSTOMER');
    customer2 = await createUser('CUSTOMER');
    artistA = await createUser('ARTIST');
    artistB = await createUser('ARTIST');
    admin = await createUser('ADMIN');
  });

  let physicalOrderId: string;
  let originalId: string;

  it('checks out an original: ₹10,000 at 10% → ₹1,000 commission / ₹9,000 artist, stock decremented, SOLD_OUT', async () => {
    const art = await createArtwork(artistA.artistId!, { price: 10000 });
    originalId = art.id;
    const add = await api().post('/api/v1/cart/items').set(customer.auth).send({ artworkId: art.id, quantity: 3 });
    expect(add.status).toBe(201);
    expect(add.body.data.items[0].quantity).toBe(1); // originals are one-of-a-kind
    expect(add.body.data.requiresShipping).toBe(true);

    const methods = await api().get('/api/v1/payments/methods').set(customer.auth);
    expect(methods.body.data.find((m: { method: string }) => m.method === 'COD').available).toBe(true);

    expect((await api().post('/api/v1/orders/checkout').set(customer.auth).send({ paymentMethod: 'COD' })).status).toBe(400); // address required
    const res = await api().post('/api/v1/orders/checkout').set(customer.auth).send({ paymentMethod: 'COD', shippingAddress: address });
    expect(res.status).toBe(201);
    physicalOrderId = res.body.data.id;
    expect(res.body.data.total).toBe(10000);
    expect(res.body.data.paymentStatus).toBe('PENDING');

    const item = await prisma.orderItem.findFirstOrThrow({ where: { orderId: physicalOrderId }, include: { commission: true, ledgerEntries: true } });
    expect(Number(item.commissionAmount)).toBe(1000);
    expect(Number(item.artistAmount)).toBe(9000);
    expect(Number(item.commission!.amount)).toBe(1000);
    const ledger = Object.fromEntries(item.ledgerEntries.map((l) => [l.type, l]));
    expect(Number(ledger.SALE_CREDIT.amount)).toBe(10000);
    expect(Number(ledger.COMMISSION_DEBIT.amount)).toBe(-1000);
    expect(ledger.SALE_CREDIT.status).toBe('PENDING');

    const after = await prisma.artwork.findUniqueOrThrow({ where: { id: art.id }, include: { inventory: true } });
    expect(after.status).toBe('SOLD_OUT');
    expect(after.inventory!.quantity).toBe(0);
    expect((await api().get('/api/v1/cart').set(customer.auth)).body.data.items).toHaveLength(0);

    // Someone else can no longer add it.
    expect((await api().post('/api/v1/cart/items').set(customer2.auth).send({ artworkId: art.id })).status).toBe(404);
  });

  it('isolates seller order views', async () => {
    const mine = await api().get('/api/v1/artists/me/orders').set(artistA.auth);
    expect(mine.status).toBe(200);
    const order = mine.body.data.find((o: { orderId: string }) => o.orderId === physicalOrderId);
    expect(order.shippingAddress.city).toBe('Bengaluru');
    expect(order.items[0].artistAmount).toBe(9000);

    const other = await api().get('/api/v1/artists/me/orders').set(artistB.auth);
    expect(other.body.data.find((o: { orderId: string }) => o.orderId === physicalOrderId)).toBeUndefined();
    expect((await api().patch(`/api/v1/artists/me/orders/${physicalOrderId}/shipment`).set(artistB.auth).send({ status: 'PACKED' })).status).toBe(404);
    expect((await api().get('/api/v1/artists/me/orders').set(customer.auth)).status).toBe(403);
    // Customers cannot read other customers' orders.
    expect((await api().get(`/api/v1/orders/${physicalOrderId}`).set(customer2.auth)).status).toBe(404);
  });

  it('ships and delivers, then COD collection releases the balance and a settlement pays it out', async () => {
    expect((await api().patch(`/api/v1/artists/me/orders/${physicalOrderId}/shipment`).set(artistA.auth).send({ status: 'SHIPPED' })).status).toBe(400); // tracking needed
    expect((await api().patch(`/api/v1/artists/me/orders/${physicalOrderId}/shipment`).set(artistA.auth).send({ status: 'SHIPPED', carrier: 'BlueDart', trackingNumber: 'BD123' })).status).toBe(200);
    expect((await api().patch(`/api/v1/artists/me/orders/${physicalOrderId}/shipment`).set(artistA.auth).send({ status: 'DELIVERED' })).status).toBe(200);
    const detail = await api().get(`/api/v1/orders/${physicalOrderId}`).set(customer.auth);
    expect(detail.body.data.status).toBe('FULFILLED');
    expect(detail.body.data.shipments[0].trackingNumber).toBe('BD123');
    expect(detail.body.data.items[0].canReview).toBe(true);

    let earnings = await api().get('/api/v1/artists/me/earnings').set(artistA.auth);
    expect(earnings.body.data.totals).toMatchObject({ grossSales: 10000, commission: 1000, net: 9000, pending: 9000, available: 0 });

    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: physicalOrderId } });
    expect((await api().patch(`/api/v1/admin/payments/${payment.id}/confirm`).set(artistA.auth).send({})).status).toBe(403);
    expect((await api().patch(`/api/v1/admin/payments/${payment.id}/confirm`).set(admin.auth).send({ reference: 'COD-1' })).status).toBe(200);
    expect((await api().patch(`/api/v1/admin/payments/${payment.id}/confirm`).set(admin.auth).send({})).status).toBe(409);

    earnings = await api().get('/api/v1/artists/me/earnings').set(artistA.auth);
    expect(earnings.body.data.totals).toMatchObject({ pending: 0, available: 9000 });

    const balances = await api().get('/api/v1/admin/settlements/balances').set(admin.auth);
    expect(balances.body.data.find((b: { artist: { id: string } }) => b.artist.id === artistA.artistId).available).toBe(9000);

    const s = await api().post('/api/v1/admin/settlements').set(admin.auth).send({ artistId: artistA.artistId, method: 'UPI' });
    expect(s.status).toBe(201);
    expect(s.body.data.amount).toBe(9000);
    expect((await api().post('/api/v1/admin/settlements').set(admin.auth).send({ artistId: artistA.artistId })).status).toBe(409);
    const done = await api().patch(`/api/v1/admin/settlements/${s.body.data.id}/complete`).set(admin.auth).send({ reference: 'UTR998877' });
    expect(done.body.data.status).toBe('COMPLETED');

    earnings = await api().get('/api/v1/artists/me/earnings').set(artistA.auth);
    expect(earnings.body.data.totals).toMatchObject({ available: 0, settled: 9000, net: 9000 });
    expect(earnings.body.data.settlements[0].status).toBe('COMPLETED');
    const txn = await prisma.settlementTransaction.findFirstOrThrow({ where: { settlementId: s.body.data.id } });
    expect(txn.method).toBe('UPI');
  });

  it('rejects COD for digital artwork and enforces download ownership, payment, limit and expiry', async () => {
    const digital = await createArtwork(artistB.artistId!, { format: 'DIGITAL', type: 'DIGITAL_ART', price: 1500, digitalFileKey: 'digital-art/test.png' });
    await api().post('/api/v1/cart/items').set(customer.auth).send({ artworkId: digital.id, quantity: 2 });
    const methods = await api().get('/api/v1/payments/methods').set(customer.auth);
    expect(methods.body.data.find((m: { method: string }) => m.method === 'COD').available).toBe(false);
    expect((await api().post('/api/v1/orders/checkout').set(customer.auth).send({ paymentMethod: 'COD' })).status).toBe(400);
    const order = await api().post('/api/v1/orders/checkout').set(customer.auth).send({ paymentMethod: 'MANUAL' });
    expect(order.status).toBe(201);
    expect(order.body.data.total).toBe(3000);
    expect(order.body.data.shippingAddress).toBeNull();
    expect(order.body.data.downloads).toHaveLength(0);

    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.body.data.id } });
    await api().patch(`/api/v1/admin/payments/${payment.id}/confirm`).set(admin.auth).send({});
    const detail = await api().get(`/api/v1/orders/${order.body.data.id}`).set(customer.auth);
    expect(detail.body.data.downloads).toHaveLength(1);
    expect(detail.body.data.items[0].fulfillmentStatus).toBe('DIGITAL_AVAILABLE');
    const accessId = detail.body.data.downloads[0].id;

    expect((await api().post(`/api/v1/downloads/${accessId}/link`).set(customer2.auth)).status).toBe(404);
    const link = await api().post(`/api/v1/downloads/${accessId}/link`).set(customer.auth);
    expect(link.status).toBe(200);
    expect(link.body.data.url).toContain('/api/v1/files/private?');
    expect(link.body.data.expiresInSeconds).toBe(60);

    await prisma.downloadAccess.update({ where: { id: accessId }, data: { maxDownloads: 2 } });
    expect((await api().post(`/api/v1/downloads/${accessId}/link`).set(customer.auth)).status).toBe(200);
    expect((await api().post(`/api/v1/downloads/${accessId}/link`).set(customer.auth)).status).toBe(429);
    await prisma.downloadAccess.update({ where: { id: accessId }, data: { maxDownloads: 10, expiresAt: new Date(Date.now() - 1000) } });
    expect((await api().post(`/api/v1/downloads/${accessId}/link`).set(customer.auth)).status).toBe(410);
    expect(await prisma.downloadLog.count({ where: { downloadAccessId: accessId } })).toBe(2);
  });

  it('cancels an unpaid order and restocks + reverses ledger', async () => {
    const print = await createArtwork(artistB.artistId!, { format: 'PRINT', type: 'PRINT', price: 2000, inventory: { create: { quantity: 5 } } });
    await api().post('/api/v1/cart/items').set(customer2.auth).send({ artworkId: print.id, quantity: 2 });
    const order = await api().post('/api/v1/orders/checkout').set(customer2.auth).send({ paymentMethod: 'COD', shippingAddress: address });
    expect(order.status).toBe(201);
    expect((await prisma.artworkInventory.findUniqueOrThrow({ where: { artworkId: print.id } })).quantity).toBe(3);
    expect((await api().post(`/api/v1/orders/${order.body.data.id}/cancel`).set(customer.auth)).status).toBe(404);
    const cancelled = await api().post(`/api/v1/orders/${order.body.data.id}/cancel`).set(customer2.auth);
    expect(cancelled.body.data.status).toBe('CANCELLED');
    expect((await prisma.artworkInventory.findUniqueOrThrow({ where: { artworkId: print.id } })).quantity).toBe(5);
    const ledger = await prisma.artistLedger.findMany({ where: { orderItem: { orderId: order.body.data.id } } });
    expect(ledger.every((l) => l.status === 'REVERSED')).toBe(true);
  });

  it('does not let artists buy their own artwork or customers buy unpublished artwork', async () => {
    const own = await createArtwork(artistA.artistId!);
    expect((await api().post('/api/v1/cart/items').set(artistA.auth).send({ artworkId: own.id })).status).toBe(400);
    const draft = await createArtwork(artistA.artistId!, { status: 'DRAFT' });
    expect((await api().post('/api/v1/cart/items').set(customer.auth).send({ artworkId: draft.id })).status).toBe(404);
    expect(originalId).toBeTruthy();
  });
});

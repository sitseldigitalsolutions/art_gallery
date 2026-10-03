import { describe, expect, it } from 'vitest';
import { api, createArtwork, createUser, prisma } from './helpers.js';

const newUser = (over: Record<string, unknown> = {}) => ({
  role: 'CUSTOMER',
  fullName: 'Nila Menon',
  email: `nila-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`,
  password: 'Passw0rd!',
  ...over,
});

describe('admin: create accounts', () => {
  it('only admins can create accounts', async () => {
    const customer = await createUser('CUSTOMER');
    const artist = await createUser('ARTIST');
    expect((await api().post('/api/v1/admin/users').send(newUser())).status).toBe(401);
    expect((await api().post('/api/v1/admin/users').set(customer.auth).send(newUser())).status).toBe(403);
    expect((await api().post('/api/v1/admin/users').set(artist.auth).send(newUser({ role: 'ADMIN' }))).status).toBe(403);
  });

  it('creates customer, admin and approved artist accounts that can log in', async () => {
    const admin = await createUser('ADMIN');
    const c = await api().post('/api/v1/admin/users').set(admin.auth).send(newUser());
    expect(c.status).toBe(201);
    expect(c.body.data.roles).toEqual(['CUSTOMER']);

    const a = await api().post('/api/v1/admin/users').set(admin.auth).send(newUser({ role: 'ADMIN' }));
    expect(a.body.data.roles).toEqual(['ADMIN']);

    const body = newUser({ role: 'ARTIST', displayName: 'Nila Studio', city: 'Kochi', bio: 'Watercolours' });
    const r = await api().post('/api/v1/admin/users').set(admin.auth).send(body);
    expect(r.status).toBe(201);
    expect(r.body.data.roles).toEqual(['ARTIST', 'CUSTOMER']);
    expect(r.body.data.artist.status).toBe('APPROVED');
    const gallery = await prisma.gallery.findFirst({ where: { artistId: r.body.data.artist.id } });
    expect(gallery?.name).toBe('Nila Studio');

    const login = await api().post('/api/v1/auth/login').send({ email: body.email, password: 'Passw0rd!' });
    expect(login.status).toBe(200);
    expect(login.body.data.user.artistStatus).toBe('APPROVED');

    const log = await prisma.auditLog.findFirst({ where: { action: 'USER_CREATED_BY_ADMIN', entityId: r.body.data.id } });
    expect(log?.actorId).toBe(admin.id);
  });

  it('validates input: duplicate email, weak password, artist name required', async () => {
    const admin = await createUser('ADMIN');
    const body = newUser();
    expect((await api().post('/api/v1/admin/users').set(admin.auth).send(body)).status).toBe(201);
    expect((await api().post('/api/v1/admin/users').set(admin.auth).send(body)).status).toBe(409);
    expect((await api().post('/api/v1/admin/users').set(admin.auth).send(newUser({ password: 'weak' }))).status).toBe(400);
    expect((await api().post('/api/v1/admin/users').set(admin.auth).send(newUser({ role: 'ARTIST' }))).status).toBe(400);
  });
});

describe('admin: delete accounts', () => {
  it('only admins can delete, a reason is required, and admins cannot delete themselves', async () => {
    const admin = await createUser('ADMIN');
    const customer = await createUser('CUSTOMER');
    const victim = await createUser('CUSTOMER');
    expect((await api().delete(`/api/v1/admin/users/${victim.id}`).set(customer.auth).send({ reason: 'spam' })).status).toBe(403);
    expect((await api().delete(`/api/v1/admin/users/${victim.id}`).set(admin.auth).send({})).status).toBe(400);
    expect((await api().delete(`/api/v1/admin/users/${admin.id}`).set(admin.auth).send({ reason: 'test' })).status).toBe(400);

    // One admin can remove another admin account (self-deletion is what keeps at least one admin).
    const second = await createUser('ADMIN');
    expect((await api().delete(`/api/v1/admin/users/${second.id}`).set(admin.auth).send({ reason: 'cleanup' })).status).toBe(200);
    expect((await api().get('/api/v1/auth/me').set(second.auth)).status).toBe(401);
  });

  it('anonymises a customer, ends sessions, frees the email and keeps orders', async () => {
    const admin = await createUser('ADMIN');
    const victim = await createUser('CUSTOMER');
    const artist = await createUser('ARTIST');
    await prisma.artistFollow.create({ data: { userId: victim.id, artistId: artist.artistId! } });
    await prisma.artist.update({ where: { id: artist.artistId! }, data: { followerCount: 1 } });
    await prisma.customerAddress.create({ data: { userId: victim.id, fullName: 'V', phone: '1', line1: 'x', city: 'c', state: 's', postalCode: '1' } });

    const res = await api().delete(`/api/v1/admin/users/${victim.id}`).set(admin.auth).send({ reason: 'Requested by user' });
    expect(res.status).toBe(200);

    const u = await prisma.user.findUniqueOrThrow({ where: { id: victim.id } });
    expect(u.status).toBe('DELETED');
    expect(u.email).not.toBe(victim.email);
    expect(u.fullName).toBe('Deleted user');
    expect(await prisma.customerAddress.count({ where: { userId: victim.id } })).toBe(0);
    expect((await prisma.artist.findUniqueOrThrow({ where: { id: artist.artistId! } })).followerCount).toBe(0);
    expect((await api().get('/api/v1/auth/me').set(victim.auth)).status).toBe(401);
    expect((await api().post('/api/v1/auth/login').send({ email: victim.email, password: 'Passw0rd!' })).status).toBe(401);
    // Email can be registered again.
    expect((await api().post('/api/v1/auth/register').send({ fullName: 'New Person', email: victim.email, password: 'Passw0rd!' })).status).toBe(201);
    // Cannot be reactivated or deleted twice.
    expect((await api().patch(`/api/v1/admin/users/${victim.id}/status`).set(admin.auth).send({ status: 'ACTIVE' })).status).toBe(400);
    expect((await api().delete(`/api/v1/admin/users/${victim.id}`).set(admin.auth).send({ reason: 'again' })).status).toBe(404);
  });

  it('takes a deleted artist offline: profile hidden, artworks archived, open requests cancelled', async () => {
    const admin = await createUser('ADMIN');
    const artist = await createUser('ARTIST');
    const customer = await createUser('CUSTOMER');
    const art = await createArtwork(artist.artistId!);
    const reqRow = await prisma.customArtRequest.create({
      data: { requestNumber: `CA-T${Date.now()}`, customerId: customer.id, artistId: artist.artistId!, instructions: 'Paint us', status: 'IN_PROGRESS' },
    });
    const artistRow = await prisma.artist.findUniqueOrThrow({ where: { id: artist.artistId! } });
    expect((await api().get(`/api/v1/artworks/${art.slug}`)).status).toBe(200);

    expect((await api().delete(`/api/v1/admin/users/${artist.id}`).set(admin.auth).send({ reason: 'Policy violation' })).status).toBe(200);

    expect((await prisma.artwork.findUniqueOrThrow({ where: { id: art.id } })).status).toBe('ARCHIVED');
    expect((await prisma.artist.findUniqueOrThrow({ where: { id: artist.artistId! } })).status).toBe('INACTIVE');
    expect((await api().get(`/api/v1/artworks/${art.slug}`)).status).toBe(404);
    expect((await api().get(`/api/v1/artists/${artistRow.slug}`)).status).toBe(404);
    expect((await prisma.customArtRequest.findUniqueOrThrow({ where: { id: reqRow.id } })).status).toBe('CANCELLED');
    expect(await prisma.notification.count({ where: { userId: customer.id, type: 'CUSTOM_ART_CANCELLED' } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { action: 'USER_DELETED', entityId: artist.id } })).toBe(1);
  });
});

import { beforeAll, describe, expect, it } from 'vitest';
import { csvCell, toCsv } from '../src/modules/analytics/analytics.routes.js';
import { api, createArtwork, createUser, prisma, type TestUser } from './helpers.js';

describe('admin, moderation & analytics', () => {
  let admin: TestUser;
  let artist: TestUser;
  let customer: TestUser;

  beforeAll(async () => {
    admin = await createUser('ADMIN');
    artist = await createUser('ARTIST');
    customer = await createUser('CUSTOMER');
  });

  it('returns 403 for non-admins on every admin surface', async () => {
    const paths = ['/api/v1/admin/dashboard', '/api/v1/admin/users', '/api/v1/admin/artists', '/api/v1/admin/artworks', '/api/v1/admin/orders', '/api/v1/admin/commissions', '/api/v1/admin/settings', '/api/v1/admin/audit-logs', '/api/v1/analytics/overview', '/api/v1/analytics/export'];
    for (const p of paths) {
      expect((await api().get(p).set(artist.auth)).status, p).toBe(403);
      expect((await api().get(p).set(customer.auth)).status, p).toBe(403);
      expect((await api().get(p)).status, p).toBe(401);
    }
    expect((await api().patch(`/api/v1/admin/artworks/x/moderate`).set(artist.auth).send({ action: 'APPROVE' })).status).toBe(403);
  });

  it('approves a pending artist with history + notification, and can suspend with a reason', async () => {
    const pending = await createUser('ARTIST', { artistStatus: 'PENDING_APPROVAL' });
    const res = await api().patch(`/api/v1/admin/artists/${pending.artistId}/status`).set(admin.auth).send({ status: 'APPROVED' });
    expect(res.status).toBe(200);
    expect(await prisma.artistApproval.count({ where: { artistId: pending.artistId!, toStatus: 'APPROVED' } })).toBe(1);
    expect(await prisma.notification.count({ where: { userId: pending.id, type: 'ARTIST_STATUS' } })).toBe(1);
    expect((await api().patch(`/api/v1/admin/artists/${pending.artistId}/status`).set(admin.auth).send({ status: 'SUSPENDED' })).status).toBe(400);
    expect((await api().patch(`/api/v1/admin/artists/${pending.artistId}/status`).set(admin.auth).send({ status: 'SUSPENDED', reason: 'Copyright violation' })).status).toBe(200);
    expect(await prisma.auditLog.count({ where: { entityId: pending.artistId!, action: { startsWith: 'ARTIST_' } } })).toBe(2);
  });

  it('moderates artwork: approve publishes and notifies followers; reject needs a reason', async () => {
    const art = await createArtwork(artist.artistId!, { status: 'PENDING_REVIEW', publishedAt: null });
    await prisma.artistFollow.create({ data: { userId: customer.id, artistId: artist.artistId! } });
    expect((await api().patch(`/api/v1/admin/artworks/${art.id}/moderate`).set(admin.auth).send({ action: 'REJECT' })).status).toBe(400);
    const res = await api().patch(`/api/v1/admin/artworks/${art.id}/moderate`).set(admin.auth).send({ action: 'APPROVE' });
    expect(res.body.data.status).toBe('APPROVED');
    const after = await prisma.artwork.findUniqueOrThrow({ where: { id: art.id } });
    expect(after.publishedAt).not.toBeNull();
    expect(await prisma.artworkApproval.count({ where: { artworkId: art.id } })).toBe(1);
    expect(await prisma.notification.count({ where: { userId: customer.id, type: 'NEW_ARTWORK' } })).toBe(1);
    expect((await api().patch(`/api/v1/admin/artworks/${art.id}/moderate`).set(admin.auth).send({ action: 'APPROVE' })).status).toBe(409);
    expect((await api().patch(`/api/v1/admin/artworks/${art.id}/featured`).set(admin.auth).send({ isFeatured: true })).body.data.isFeatured).toBe(true);
    const suspended = await api().patch(`/api/v1/admin/artworks/${art.id}/moderate`).set(admin.auth).send({ action: 'SUSPEND', reason: 'Reported' });
    expect(suspended.body.data.status).toBe('SUSPENDED');
    expect((await prisma.artwork.findUniqueOrThrow({ where: { id: art.id } })).isFeatured).toBe(false);
  });

  it('manages commission rules with validation and uniqueness', async () => {
    const created = await api().post('/api/v1/admin/commissions').set(admin.auth).send({ scope: 'ARTIST', targetId: artist.artistId, percentage: 7.5 });
    expect(created.status).toBe(201);
    expect((await api().post('/api/v1/admin/commissions').set(admin.auth).send({ scope: 'ARTIST', targetId: artist.artistId, percentage: 8 })).status).toBe(409);
    expect((await api().post('/api/v1/admin/commissions').set(admin.auth).send({ scope: 'GLOBAL', targetId: 'x', percentage: 8 })).status).toBe(400);
    expect((await api().post('/api/v1/admin/commissions').set(admin.auth).send({ scope: 'CATEGORY', targetId: 'missing', percentage: 8 })).status).toBe(400);
    expect((await api().patch(`/api/v1/admin/commissions/${created.body.data.id}`).set(admin.auth).send({ percentage: 120 })).status).toBe(400);
    const list = await api().get('/api/v1/admin/commissions').set(admin.auth);
    expect(list.body.data.find((r: { id: string }) => r.id === created.body.data.id).percentage).toBe(7.5);
    expect((await api().delete(`/api/v1/admin/commissions/${created.body.data.id}`).set(admin.auth)).status).toBe(200);
  });

  it('serves dashboard, analytics and a CSV export', async () => {
    const dash = await api().get('/api/v1/admin/dashboard').set(admin.auth);
    expect(dash.status).toBe(200);
    expect(dash.body.data.counts.artists).toBeGreaterThan(0);
    const overview = await api().get('/api/v1/analytics/overview?from=2020-01-01').set(admin.auth);
    expect(overview.status).toBe(200);
    expect(overview.body.data.totals).toHaveProperty('platformCommission');
    expect(Array.isArray(overview.body.data.salesByDay)).toBe(true);
    const bad = await api().get('/api/v1/analytics/overview?from=not-a-date').set(admin.auth);
    expect(bad.status).toBe(400);
    const csv = await api().get('/api/v1/analytics/export?type=artists').set(admin.auth);
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.headers['content-disposition']).toContain('artists-');
    expect(csv.text).toContain('Artist,Email,Status');
  });

  it('escapes CSV cells and neutralises formula injection', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+1')).toBe("'+1");
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell(null)).toBe('');
    expect(toCsv(['a'], [['x\ny']])).toBe('a\r\n"x\ny"\r\n');
  });

  it('prevents admins from suspending themselves and revokes sessions on suspension', async () => {
    expect((await api().patch(`/api/v1/admin/users/${admin.id}/status`).set(admin.auth).send({ status: 'SUSPENDED' })).status).toBe(400);
    const victim = await createUser('CUSTOMER');
    expect((await api().patch(`/api/v1/admin/users/${victim.id}/status`).set(admin.auth).send({ status: 'SUSPENDED', reason: 'Fraud' })).status).toBe(200);
    expect((await api().get('/api/v1/auth/me').set(victim.auth)).status).toBe(401);
  });

  it('validates banner links and settings keys', async () => {
    expect((await api().post('/api/v1/admin/banners').set(admin.auth).send({ title: 'Hero', linkUrl: 'javascript:alert(1)' })).status).toBe(400);
    const banner = await api().post('/api/v1/admin/banners').set(admin.auth).send({ title: 'Hero', linkUrl: '/gallery', sortOrder: 3 });
    expect(banner.status).toBe(201);
    const patched = await api().patch(`/api/v1/admin/banners/${banner.body.data.id}`).set(admin.auth).send({ subtitle: 'New' });
    expect(patched.body.data.sortOrder).toBe(3); // PATCH must not reset defaults
    expect((await api().put('/api/v1/admin/settings/shipping.flatFee').set(admin.auth).send({ value: 0 })).status).toBe(200);
    expect((await api().put('/api/v1/admin/settings/bad%20key').set(admin.auth).send({ value: 1 })).status).toBe(400);
  });
});

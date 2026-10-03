import { describe, expect, it } from 'vitest';
import { api, createUser, prisma } from './helpers.js';

describe('auth', () => {
  it('registers a customer, hides the password hash and issues a refresh cookie', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ fullName: 'Asha Rao', email: 'asha@test.local', password: 'Passw0rd!' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.roles).toEqual(['CUSTOMER']);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(res.headers['set-cookie']?.[0]).toMatch(/ag_rt=.*HttpOnly/);
  });

  it('rejects weak passwords and duplicate emails', async () => {
    const weak = await api().post('/api/v1/auth/register').send({ fullName: 'X Y', email: 'weak@test.local', password: 'short' });
    expect(weak.status).toBe(400);
    const dup = await api()
      .post('/api/v1/auth/register')
      .send({ fullName: 'Asha Rao', email: 'asha@test.local', password: 'Passw0rd!' });
    expect(dup.status).toBe(409);
  });

  it('registers an artist as PENDING_APPROVAL with artist + customer roles', async () => {
    const res = await api().post('/api/v1/auth/register/artist').send({
      fullName: 'Ravi Varma',
      email: 'ravi@test.local',
      password: 'Passw0rd!',
      displayName: 'Ravi Studio',
      artistType: 'STUDIO',
      bio: 'Oil painter',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.artistStatus).toBe('PENDING_APPROVAL');
    expect([...res.body.data.user.roles].sort()).toEqual(['ARTIST', 'CUSTOMER']);
  });

  it('logs in, rejects bad passwords and locks after repeated failures', async () => {
    const good = await api().post('/api/v1/auth/login').send({ email: 'asha@test.local', password: 'Passw0rd!' });
    expect(good.status).toBe(200);
    for (let i = 0; i < 5; i++) {
      const bad = await api().post('/api/v1/auth/login').send({ email: 'asha@test.local', password: 'Wrong123!' });
      expect(bad.status).toBe(401);
    }
    const locked = await api().post('/api/v1/auth/login').send({ email: 'asha@test.local', password: 'Passw0rd!' });
    expect(locked.status).toBe(401);
    expect(locked.body.error.message).toMatch(/locked/i);
  });

  it('rotates refresh tokens and revokes all sessions on reuse', async () => {
    const reg = await api()
      .post('/api/v1/auth/register')
      .send({ fullName: 'Rot Ate', email: 'rotate@test.local', password: 'Passw0rd!' });
    const cookie = reg.headers['set-cookie'][0].split(';')[0];
    const first = await api().post('/api/v1/auth/refresh').set('Cookie', cookie).set('Origin', 'http://localhost:5173');
    expect(first.status).toBe(200);
    const reuse = await api().post('/api/v1/auth/refresh').set('Cookie', cookie).set('Origin', 'http://localhost:5173');
    expect(reuse.status).toBe(401);
    const active = await prisma.session.count({ where: { user: { email: 'rotate@test.local' }, revokedAt: null } });
    expect(active).toBe(0);
  });

  it('rejects refresh from a foreign origin (CSRF)', async () => {
    const reg = await api().post('/api/v1/auth/register').send({ fullName: 'Cs Rf', email: 'csrf@test.local', password: 'Passw0rd!' });
    const cookie = reg.headers['set-cookie'][0].split(';')[0];
    const res = await api().post('/api/v1/auth/refresh').set('Cookie', cookie).set('Origin', 'https://evil.example');
    expect(res.status).toBe(403);
  });

  it('requires a valid token for /auth/me and rejects suspended users', async () => {
    expect((await api().get('/api/v1/auth/me')).status).toBe(401);
    expect((await api().get('/api/v1/auth/me').set('Authorization', 'Bearer garbage')).status).toBe(401);
    const u = await createUser('CUSTOMER');
    expect((await api().get('/api/v1/auth/me').set(u.auth)).status).toBe(200);
    await prisma.user.update({ where: { id: u.id }, data: { status: 'SUSPENDED' } });
    expect((await api().get('/api/v1/auth/me').set(u.auth)).status).toBe(401);
  });
});

import { describe, expect, it } from 'vitest';
import { api, createUser, prisma } from './helpers.js';

describe('site config', () => {
  it('serves a complete default config publicly', async () => {
    await prisma.systemSetting.deleteMany({ where: { key: 'site.config' } });
    const res = await api().get('/api/v1/site-config');
    expect(res.status).toBe(200);
    expect(res.body.data.theme.primary).toBe('#8b2bd9');
    expect(res.body.data.homeSections).toHaveLength(14);
    expect(res.body.data.hero.headline).toBe('Art That Tells Your Story');
  });

  it('only lets admins change or reset it', async () => {
    const customer = await createUser('CUSTOMER');
    const artist = await createUser('ARTIST');
    expect((await api().put('/api/v1/admin/site-config').send({})).status).toBe(401);
    expect((await api().put('/api/v1/admin/site-config').set(customer.auth).send({})).status).toBe(403);
    expect((await api().put('/api/v1/admin/site-config').set(artist.auth).send({})).status).toBe(403);
    expect((await api().post('/api/v1/admin/site-config/reset').set(artist.auth)).status).toBe(403);
  });

  it('saves theme, layout and content, and audits the change', async () => {
    const admin = await createUser('ADMIN');
    const current = (await api().get('/api/v1/site-config')).body.data;
    const sections = [...current.homeSections].reverse();
    sections[0] = { ...sections[0], enabled: false, title: 'Our Stories' };
    const res = await api()
      .put('/api/v1/admin/site-config')
      .set(admin.auth)
      .send({
        ...current,
        theme: { ...current.theme, preset: 'custom', primary: '#123456' },
        homeSections: sections,
        hero: { ...current.hero, effect: 'slide', intervalSeconds: 5 },
        announcement: { ...current.announcement, enabled: true, text: 'Diwali sale', href: '/gallery' },
      });
    expect(res.status).toBe(200);

    const read = (await api().get('/api/v1/site-config')).body.data;
    expect(read.theme.primary).toBe('#123456');
    expect(read.homeSections[0]).toMatchObject({ id: 'testimonials', enabled: false, title: 'Our Stories' });
    expect(read.homeSections.map((s: { id: string }) => s.id)).toEqual(sections.map((s) => s.id));
    expect(read.hero).toMatchObject({ effect: 'slide', intervalSeconds: 5 });
    expect(read.announcement.text).toBe('Diwali sale');

    const log = await prisma.auditLog.findFirst({ where: { action: 'SITE_CONFIG_UPDATED' }, orderBy: { createdAt: 'desc' } });
    expect(log?.metadata).toMatchObject({ changedSections: expect.arrayContaining(['theme', 'homeSections', 'hero', 'announcement']) });
  });

  it('rejects invalid colours and script links (XSS)', async () => {
    const admin = await createUser('ADMIN');
    const bad = [
      { theme: { primary: 'red' } },
      { theme: { primary: '#12345' } },
      { hero: { primaryCtaHref: 'javascript:alert(1)' } },
      { announcement: { href: 'data:text/html,<script>alert(1)</script>' } },
      { social: { instagram: '//evil.example' } },
      { hero: { intervalSeconds: 1 } },
      { homeSections: [{ id: 'not-a-section' }] },
    ];
    for (const body of bad) {
      const res = await api().put('/api/v1/admin/site-config').set(admin.auth).send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
  });

  it('upgrades partial documents with defaults and missing sections', async () => {
    const admin = await createUser('ADMIN');
    const res = await api()
      .put('/api/v1/admin/site-config')
      .set(admin.auth)
      .send({ homeSections: [{ id: 'trending' }, { id: 'trending' }], branding: { siteName: 'Moon Art' } });
    expect(res.status).toBe(200);
    expect(res.body.data.homeSections).toHaveLength(14);
    expect(res.body.data.homeSections[0].id).toBe('trending');
    expect(res.body.data.branding.siteName).toBe('Moon Art');
    expect(res.body.data.theme.ink).toBe('#0b0a12');
  });

  it('serves defaults if the stored document is corrupt, and reset restores defaults', async () => {
    const admin = await createUser('ADMIN');
    await prisma.systemSetting.update({ where: { key: 'site.config' }, data: { value: { theme: { primary: 42 } } } });
    expect((await api().get('/api/v1/site-config')).body.data.theme.primary).toBe('#8b2bd9');
    const reset = await api().post('/api/v1/admin/site-config/reset').set(admin.auth);
    expect(reset.status).toBe(200);
    expect(reset.body.data.branding.siteName).toBe('MyMoons Gallery');
  });

  it('cannot be written through the generic settings endpoint', async () => {
    const admin = await createUser('ADMIN');
    const res = await api()
      .put('/api/v1/admin/settings/site.config')
      .set(admin.auth)
      .send({ value: { hero: { primaryCtaHref: 'javascript:alert(1)' } } });
    expect(res.status).toBe(400);
  });
});

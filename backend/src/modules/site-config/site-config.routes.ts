import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma/client.js';
import { audit } from '../../shared/audit.js';
import { ok, type RouteDef } from '../../shared/http.js';
import { parse } from '../../shared/validation.js';
import { logger } from '../../utils/logger.js';
import { defaultSiteConfig, siteConfigSchema, type SiteConfig } from './site-config.schema.js';

export const SITE_CONFIG_KEY = 'site.config';

/** Read the stored config, upgrading it with defaults; a corrupt document falls back to defaults. */
export async function loadSiteConfig(): Promise<SiteConfig> {
  const row = await prisma.systemSetting.findUnique({ where: { key: SITE_CONFIG_KEY } });
  if (!row) return defaultSiteConfig();
  const parsed = siteConfigSchema.safeParse(row.value);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues }, 'Stored site config is invalid; serving defaults');
    return defaultSiteConfig();
  }
  return parsed.data;
}

async function saveSiteConfig(config: SiteConfig) {
  const value = config as unknown as Prisma.InputJsonValue;
  await prisma.systemSetting.upsert({ where: { key: SITE_CONFIG_KEY }, update: { value }, create: { key: SITE_CONFIG_KEY, value } });
}

export const siteConfigRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/site-config',
    handler: async () => ok(await loadSiteConfig()),
  },
  {
    method: 'PUT',
    path: '/admin/site-config',
    roles: ['ADMIN'],
    handler: async (ctx) => {
      const next = parse(siteConfigSchema, ctx.body);
      const before = await loadSiteConfig();
      await saveSiteConfig(next);
      await audit(ctx.user, 'SITE_CONFIG_UPDATED', 'SystemSetting', SITE_CONFIG_KEY, {
        changedSections: (Object.keys(next) as Array<keyof SiteConfig>).filter(
          (k) => JSON.stringify(next[k]) !== JSON.stringify(before[k]),
        ),
      }, { ip: ctx.ip });
      return ok(next);
    },
  },
  {
    method: 'POST',
    path: '/admin/site-config/reset',
    roles: ['ADMIN'],
    handler: async (ctx) => {
      const config = defaultSiteConfig();
      await saveSiteConfig(config);
      await audit(ctx.user, 'SITE_CONFIG_RESET', 'SystemSetting', SITE_CONFIG_KEY, undefined, { ip: ctx.ip });
      return ok(config);
    },
  },
];

import { get, post, put } from '@/lib/api';
import { normalizeSiteConfig, type SiteConfig } from '@/lib/siteConfig';

export const siteConfigApi = {
  get: async () => normalizeSiteConfig(await get<SiteConfig>('/site-config')),
  save: async (config: SiteConfig) => normalizeSiteConfig(await put<SiteConfig>('/admin/site-config', config)),
  reset: async () => normalizeSiteConfig(await post<SiteConfig>('/admin/site-config/reset', {})),
};

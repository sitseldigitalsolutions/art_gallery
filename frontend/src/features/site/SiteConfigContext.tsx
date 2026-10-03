import { useQuery } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { applyThemeVariables, DEFAULT_SITE_CONFIG, isExternalHref, type SiteConfig } from '@/lib/siteConfig';
import { siteConfigApi } from './api';

interface SiteConfigValue {
  /** Effective config (admin live preview wins over the saved one). */
  config: SiteConfig;
  saved: SiteConfig;
  isLoading: boolean;
  /** Admin settings page pushes unsaved edits here for a live preview; null clears it. */
  setPreview: (config: SiteConfig | null) => void;
}

const SiteConfigContext = createContext<SiteConfigValue>({
  config: DEFAULT_SITE_CONFIG,
  saved: DEFAULT_SITE_CONFIG,
  isLoading: false,
  setPreview: () => undefined,
});

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const q = useQuery({
    queryKey: ['site-config'],
    queryFn: siteConfigApi.get,
    placeholderData: DEFAULT_SITE_CONFIG,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const [preview, setPreview] = useState<SiteConfig | null>(null);
  const saved = q.data ?? DEFAULT_SITE_CONFIG;
  const config = preview ?? saved;

  useEffect(() => {
    applyThemeVariables(config.theme);
  }, [config.theme]);

  useEffect(() => {
    const base = config.branding.siteName;
    if (!document.title.includes(base)) document.title = `${base} — ${config.branding.tagline || 'Art Gallery'}`;
  }, [config.branding.siteName, config.branding.tagline]);

  const value = useMemo(() => ({ config, saved, isLoading: q.isLoading, setPreview }), [config, saved, q.isLoading]);

  return (
    <SiteConfigContext.Provider value={value}>
      <MotionConfig reducedMotion={config.animations.enabled ? 'user' : 'always'}>{children}</MotionConfig>
    </SiteConfigContext.Provider>
  );
}

export const useSiteConfig = () => useContext(SiteConfigContext);

const INTENSITY = {
  subtle: { distance: 0.5, duration: 0.8, stagger: 0.6 },
  normal: { distance: 1, duration: 1, stagger: 1 },
  lively: { distance: 1.6, duration: 1.15, stagger: 1.4 },
} as const;

/** Motion preferences derived from the admin animation settings. */
export function useMotionPrefs() {
  const { config } = useSiteConfig();
  const a = config.animations;
  const scale = a.enabled ? INTENSITY[a.intensity] : { distance: 0, duration: 0.01, stagger: 0 };
  return { enabled: a.enabled, pageTransitions: a.enabled && a.pageTransitions, intensity: a.intensity, ...scale };
}

/** Link that works for both internal paths (router) and external URLs (new tab, no opener). */
export function SmartLink({ href, className, children, ...rest }: { href: string; className?: string; children: ReactNode; 'aria-label'?: string }) {
  if (!href) return <span className={className}>{children}</span>;
  if (isExternalHref(href)) {
    return (
      <a href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer" className={className} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className} {...rest}>
      {children}
    </Link>
  );
}

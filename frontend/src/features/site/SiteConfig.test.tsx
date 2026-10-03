import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { applyThemeVariables, DEFAULT_SITE_CONFIG, HOME_SECTION_IDS, THEME_PRESETS, type SiteConfig } from '@/lib/siteConfig';
import type { Banner, HomeData } from '@/lib/types';
import { moveSection, SectionManager } from '@/features/admin/AdminAppearance';
import { Hero } from '@/features/home/Hero';
import HomePage from '@/features/home/HomePage';
import { SiteConfigProvider } from './SiteConfigContext';

const siteConfig = vi.hoisted(() => ({ current: null as SiteConfig | null }));

vi.mock('./api', () => ({
  siteConfigApi: { get: vi.fn(async () => siteConfig.current), save: vi.fn(), reset: vi.fn() },
}));

const emptyHome: HomeData = {
  banners: [],
  featuredArtworks: [],
  trendingArtworks: [],
  newArtworks: [],
  featuredArtists: [],
  newArtists: [],
  featuredGalleries: [],
  popularCollections: [],
  categories: [],
  styles: [],
  mediums: [],
  themes: [],
  testimonials: [],
  stats: { artworks: 0, artists: 0, customers: 0, completedCustomArt: 0 },
  recentlyViewed: [],
  recommended: [],
};

vi.mock('@/features/artworks/api', () => ({
  catalogApi: { home: vi.fn(async () => emptyHome), taxonomy: vi.fn(async () => []) },
}));

describe('theme', () => {
  it('applies the configured colours, radius and fonts as CSS variables', () => {
    const root = document.createElement('div');
    applyThemeVariables({ ...DEFAULT_SITE_CONFIG.theme, ...THEME_PRESETS['midnight-teal'], radius: 'sharp', scriptFont: 'Pinyon Script' }, root);
    expect(root.style.getPropertyValue('--color-brand')).toBe('#0f9d9a');
    expect(root.style.getPropertyValue('--color-ink')).toBe('#081316');
    expect(root.style.getPropertyValue('--color-brand-light')).toMatch(/^#[0-9a-f]{6}$/);
    expect(root.style.getPropertyValue('--radius-2xl')).toBe('0.375rem');
    expect(root.style.getPropertyValue('--font-script')).toContain('Pinyon Script');
  });
});

describe('homepage section manager', () => {
  const sections = DEFAULT_SITE_CONFIG.homeSections;

  it('moves sections without losing any', () => {
    const moved = moveSection(sections, 6, 0);
    expect(moved[0].id).toBe('trending');
    expect(moved).toHaveLength(sections.length);
    expect(new Set(moved.map((s) => s.id))).toEqual(new Set(HOME_SECTION_IDS));
    expect(moveSection(sections, 0, 99)).toBe(sections);
  });

  it('reorders and hides sections from the admin controls', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<SectionManager sections={sections} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Move Trending artwork up' }));
    const up = onChange.mock.calls[0][0].map((s: { id: string }) => s.id);
    expect(up.indexOf('trending')).toBe(up.indexOf('photoToArt') - 1);

    await user.click(screen.getByRole('button', { name: 'Move Customer stories to top' }));
    expect(onChange.mock.calls[1][0][0].id).toBe('testimonials');

    await user.click(screen.getByRole('switch', { name: 'Show Collections' }));
    const hidden = onChange.mock.calls[2][0].find((s: { id: string }) => s.id === 'collections');
    expect(hidden.enabled).toBe(false);
  });
});

describe('hero carousel', () => {
  const banners: Banner[] = [1, 2, 3].map((i) => ({ id: `b${i}`, title: `Banner ${i}`, subtitle: null, imageUrl: `/img${i}.webp`, linkUrl: null }));
  const selected = () => screen.getAllByRole('tab').findIndex((t) => t.getAttribute('aria-selected') === 'true');

  it('navigates with next, previous and the dots', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Hero banners={banners} />);
    expect(selected()).toBe(0);
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(selected()).toBe(1);
    await user.click(screen.getByRole('tab', { name: /Go to slide 3/ }));
    expect(selected()).toBe(2);
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(selected()).toBe(0); // wraps around
    await user.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(selected()).toBe(2);
  });

  it('hides controls when there is only one banner', () => {
    renderWithProviders(<Hero banners={banners.slice(0, 1)} />);
    expect(screen.queryByRole('button', { name: 'Next slide' })).not.toBeInTheDocument();
  });
});

describe('homepage layout from site config', () => {
  it('renders enabled sections in the configured order and skips hidden ones', async () => {
    const order = ['testimonials', 'styles', 'categories', 'trending'] as const;
    siteConfig.current = {
      ...DEFAULT_SITE_CONFIG,
      homeSections: [
        ...order.map((id) => ({ id, enabled: true, title: '', subtitle: '' })),
        ...HOME_SECTION_IDS.filter((id) => !(order as readonly string[]).includes(id)).map((id) => ({ id, enabled: false, title: '', subtitle: '' })),
      ],
    };
    const { container } = renderWithProviders(
      <SiteConfigProvider>
        <HomePage />
      </SiteConfigProvider>,
    );
    await waitFor(() => {
      const rendered = [...container.querySelectorAll('[data-section]')].map((e) => e.getAttribute('data-section'));
      expect(rendered).toEqual([...order]);
    });
  });
});

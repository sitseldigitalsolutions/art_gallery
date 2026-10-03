import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { FilterPanel } from './GalleryPage';
import { ArtworkTile } from '@/components/cards';
import type { ArtworkCard } from '@/lib/types';

vi.mock('./api', () => ({
  catalogApi: {
    taxonomy: vi.fn(async (kind: string) =>
      kind === 'categories' ? [{ id: 'c1', name: 'Portraits', slug: 'portraits', artworkCount: 4 }] : kind === 'styles' ? [{ id: 's1', name: 'Pop Art', slug: 'pop-art', artworkCount: 2 }] : [],
    ),
  },
}));

const location = () => screen.getAllByTestId('location')[0].textContent ?? '';

describe('gallery filters', () => {
  it('syncs chosen filters to the URL query and clears them', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FilterPanel />, { route: '/gallery?q=moon' });

    await user.click(await screen.findByRole('button', { name: 'Portraits' }));
    await waitFor(() => expect(location()).toContain('category=portraits'));
    expect(location()).toContain('q=moon');

    await user.click(screen.getByRole('button', { name: 'Pop Art' }));
    await user.click(screen.getByRole('button', { name: 'Digital' }));
    await user.click(screen.getByRole('button', { name: 'Colour purple' }));
    await waitFor(() => expect(location()).toMatch(/style=pop-art.*format=DIGITAL.*color=purple|format=DIGITAL/));

    await user.type(screen.getByLabelText('Minimum price'), '1000');
    await user.type(screen.getByLabelText('Maximum price'), '5000');
    await user.click(screen.getByRole('button', { name: 'Go' }));
    await waitFor(() => expect(location()).toContain('minPrice=1000'));
    expect(location()).toContain('maxPrice=5000');

    // Toggling an active chip removes it.
    await user.click(screen.getByRole('button', { name: 'Portraits' }));
    await waitFor(() => expect(location()).not.toContain('category='));

    await user.click(screen.getByRole('button', { name: /clear all/i }));
    await waitFor(() => expect(location()).toBe('/gallery'));
  });
});

const art: ArtworkCard = {
  id: 'w1',
  slug: 'blue-river',
  title: 'Blue River',
  type: 'ORIGINAL_PAINTING',
  format: 'ORIGINAL',
  status: 'APPROVED',
  price: 12000,
  discountPrice: 9500,
  currency: 'INR',
  imageUrl: 'http://x/img.webp',
  thumbnailUrl: 'http://x/thumb.webp',
  imageWidth: 800,
  imageHeight: 1000,
  orientation: 'PORTRAIT',
  dominantColor: 'blue',
  isCustomizable: true,
  isFeatured: false,
  ratingAverage: 4.5,
  ratingCount: 2,
  available: true,
  artist: { id: 'a1', slug: 'meera', displayName: 'Meera Iyer', avatarUrl: null },
  category: { id: 'c1', name: 'Paintings', slug: 'paintings' },
  style: null,
  medium: null,
};

describe('ArtworkTile', () => {
  it('shows the discounted price with the original struck through', () => {
    renderWithProviders(<ArtworkTile artwork={art} />);
    expect(screen.getByTestId('price')).toHaveTextContent('₹9,500');
    expect(screen.getByTestId('original-price')).toHaveTextContent('₹12,000');
    expect(screen.getByText('Blue River')).toBeInTheDocument();
    expect(screen.getByText('Meera Iyer')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/artworks/blue-river');
  });

  it('shows only the price when there is no discount, and a sold badge when unavailable', () => {
    renderWithProviders(<ArtworkTile artwork={{ ...art, discountPrice: null, available: false }} />);
    expect(screen.getByTestId('price')).toHaveTextContent('₹12,000');
    expect(screen.queryByTestId('original-price')).toBeNull();
    expect(screen.getByText('Sold')).toBeInTheDocument();
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { customer, renderWithProviders } from '@/test/utils';
import { HeartButton } from '@/components/cards';
import { wishlistApi } from './api';

vi.mock('./api', () => ({
  wishlistApi: {
    ids: vi.fn(),
    add: vi.fn().mockResolvedValue({ saved: true }),
    remove: vi.fn().mockResolvedValue({ saved: false }),
  },
}));

describe('wishlist toggle', () => {
  beforeEach(() => {
    vi.mocked(wishlistApi.ids).mockResolvedValue({ ARTWORK: [], ARTIST: [], GALLERY: [], COLLECTION: [] });
    vi.mocked(wishlistApi.add).mockClear();
    vi.mocked(wishlistApi.remove).mockClear();
  });

  it('adds an unsaved artwork and shows it as saved', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeartButton type="ARTWORK" id="w1" />, { user: customer });
    const btn = await screen.findByRole('button', { name: /save to wishlist/i });
    await waitFor(() => expect(wishlistApi.ids).toHaveBeenCalled());
    // After the add, the server reports the item as saved on refetch.
    vi.mocked(wishlistApi.ids).mockResolvedValue({ ARTWORK: ['w1'], ARTIST: [], GALLERY: [], COLLECTION: [] });
    await user.click(btn);
    await waitFor(() => expect(wishlistApi.add).toHaveBeenCalledWith('ARTWORK', 'w1'));
    expect(await screen.findByRole('button', { name: /remove from wishlist/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('removes an already saved artwork', async () => {
    vi.mocked(wishlistApi.ids).mockResolvedValue({ ARTWORK: ['w1'], ARTIST: [], GALLERY: [], COLLECTION: [] });
    const user = userEvent.setup();
    renderWithProviders(<HeartButton type="ARTWORK" id="w1" />, { user: customer });
    const btn = await screen.findByRole('button', { name: /remove from wishlist/i });
    await user.click(btn);
    await waitFor(() => expect(wishlistApi.remove).toHaveBeenCalledWith('ARTWORK', 'w1'));
  });

  it('sends anonymous visitors to login instead of calling the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeartButton type="ARTWORK" id="w1" />, { user: null, route: '/artworks/x' });
    await user.click(screen.getByRole('button', { name: /save to wishlist/i }));
    expect(wishlistApi.add).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getAllByTestId('location')[0]).toHaveTextContent('/login?next=%2Fartworks%2Fx'));
  });
});

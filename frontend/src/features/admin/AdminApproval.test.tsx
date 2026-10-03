import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { admin, renderWithProviders } from '@/test/utils';
import { AdminArtists, AdminArtworks } from './AdminModeration';
import { adminApi } from './api';

vi.mock('./api', () => ({
  adminApi: {
    artists: vi.fn().mockResolvedValue({
      data: [{ id: 'ar1', displayName: 'Kavya Studio', status: 'PENDING_APPROVAL', type: 'STUDIO', user: { email: 'k@test.local' }, createdAt: '2026-09-01' }],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    }),
    artistStatus: vi.fn().mockResolvedValue({}),
    artistFeatured: vi.fn(),
    artistCommission: vi.fn(),
    artist: vi.fn(),
    artworks: vi.fn().mockResolvedValue({
      data: [{ id: 'w9', title: 'Lotus Pond', status: 'PENDING_REVIEW', price: 5000, format: 'ORIGINAL', type: 'ORIGINAL_PAINTING', artist: { displayName: 'Kavya Studio' } }],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    }),
    moderate: vi.fn().mockResolvedValue({}),
    artworkFeatured: vi.fn(),
  },
}));

describe('admin approvals', () => {
  it('approves a pending artist', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminArtists />, { user: admin, route: '/admin/artists' });
    const row = (await screen.findByText('Kavya Studio')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(adminApi.artistStatus).toHaveBeenCalledWith('ar1', 'APPROVED', undefined));
  });

  it('requires a reason before rejecting an artwork', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminArtworks />, { user: admin, route: '/admin/artworks' });
    const row = (await screen.findByText('Lotus Pond')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Reject' }));
    const dialog = await screen.findByRole('dialog');
    const ok = within(dialog).getByRole('button', { name: /ok/i });
    expect(ok).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Reason'), 'Low resolution images');
    await user.click(ok);
    await waitFor(() => expect(adminApi.moderate).toHaveBeenCalledWith('w9', 'REJECT', 'Low resolution images'));
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { customer, renderWithProviders } from '@/test/utils';
import { CreateYourArtWizard } from './CreateYourArtPage';
import { PHOTO_MAX_BYTES, validatePhoto } from './validation';

vi.mock('@/features/artworks/api', () => ({
  catalogApi: {
    taxonomy: vi.fn().mockResolvedValue([{ id: 's1', name: 'Watercolor', slug: 'watercolor', imageUrl: null, artworkCount: 3 }]),
  },
}));
vi.mock('./api', () => ({
  customArtApi: { artists: vi.fn().mockResolvedValue([]), create: vi.fn() },
}));

const file = (name: string, type: string, size = 1024) => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('validatePhoto', () => {
  it('accepts JPEG/PNG/WebP and rejects other types, empty and oversize files', () => {
    expect(validatePhoto(file('a.jpg', 'image/jpeg'))).toBeNull();
    expect(validatePhoto(file('a.webp', 'image/webp'))).toBeNull();
    expect(validatePhoto(file('a.gif', 'image/gif'))).toMatch(/not a JPEG/);
    expect(validatePhoto(file('a.pdf', 'application/pdf'))).toMatch(/not a JPEG/);
    expect(validatePhoto(file('big.png', 'image/png', PHOTO_MAX_BYTES + 1))).toMatch(/larger than 15 MB/);
    expect(validatePhoto(file('empty.png', 'image/png', 0))).toMatch(/empty/);
  });
});

describe('Create Your Art wizard', () => {
  it('cannot continue without a photo, rejects invalid files, then allows continuing', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderWithProviders(<CreateYourArtWizard />, { user: customer, route: '/create-your-art' });

    const next = screen.getByRole('button', { name: /continue/i });
    expect(next).toBeDisabled();

    const input = screen.getByTestId('photo-input') as HTMLInputElement;
    await user.upload(input, file('notes.txt', 'text/plain'));
    expect(await screen.findByRole('alert')).toHaveTextContent(/not a JPEG, PNG or WebP/);
    expect(next).toBeDisabled();

    await user.upload(input, file('huge.jpg', 'image/jpeg', PHOTO_MAX_BYTES + 10));
    expect(await screen.findByRole('alert')).toHaveTextContent(/larger than 15 MB/);
    expect(next).toBeDisabled();

    await user.upload(input, file('family.png', 'image/png'));
    await waitFor(() => expect(next).toBeEnabled());
    expect(screen.getByAltText('Selected photo 1')).toBeInTheDocument();

    await user.click(next);
    expect(await screen.findByText('Choose an art style')).toBeInTheDocument();
    // Step 2 requires a style before continuing.
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    await user.click(await screen.findByRole('button', { name: /watercolor/i }));
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
  });
});

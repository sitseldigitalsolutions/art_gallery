import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { ArtworkForm } from './ArtworkForm';

const tax = [{ id: 'c1', name: 'Paintings', slug: 'paintings', artworkCount: 0 }];

describe('seller artwork form', () => {
  it('blocks submission and shows errors when required fields are missing', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ArtworkForm categories={tax} styles={[]} mediums={[]} themes={[]} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: /save artwork/i }));
    expect(await screen.findByText('Please enter a title')).toBeInTheDocument();
    expect(screen.getByText('Choose a category')).toBeInTheDocument();
    expect(screen.getByText('Enter a price')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a discount that is not lower than the price', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ArtworkForm categories={tax} styles={[]} mediums={[]} themes={[]} onSubmit={onSubmit} initial={{ title: 'Dawn', categoryId: 'c1', price: 1000, discountPrice: 1500 }} />,
    );
    await user.click(screen.getByRole('button', { name: /save artwork/i }));
    expect(await screen.findByText('Must be lower than the price')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid values', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ArtworkForm categories={tax} styles={[]} mediums={[]} themes={[]} onSubmit={onSubmit} initial={{ title: 'Dawn', categoryId: 'c1', price: 1000 }} />);
    await user.click(screen.getByRole('button', { name: /save artwork/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ title: 'Dawn', categoryId: 'c1', price: 1000, format: 'ORIGINAL', discountPrice: null });
  });
});

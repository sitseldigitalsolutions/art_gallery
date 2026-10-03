import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { admin, renderWithProviders } from '@/test/utils';
import { CreateAccountButton, DeleteAccountButton, generatePassword } from './AdminAccounts';
import { adminApi } from './api';

vi.mock('./api', () => ({
  adminApi: {
    createUser: vi.fn(async (body: Record<string, unknown>) => ({ id: 'new', ...body })),
    deleteUser: vi.fn(async (id: string) => ({ id, deleted: true, cancelledRequests: 1 })),
  },
}));

describe('generatePassword', () => {
  it('always satisfies the password rules', () => {
    for (let i = 0; i < 50; i++) {
      const p = generatePassword();
      expect(p).toHaveLength(14);
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/[0-9]/);
    }
  });
});

describe('create account (admin)', () => {
  it('creates an approved artist with gallery details', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAccountButton defaultRole="ARTIST" label="Add artist" />, { user: admin });
    await user.click(screen.getByRole('button', { name: /Add artist/ }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Full name'), 'Nila Menon');
    await user.type(within(dialog).getByLabelText('Email'), 'nila@example.com');
    await user.type(within(dialog).getByLabelText('Artist or gallery name'), 'Nila Studio');
    await user.click(within(dialog).getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(adminApi.createUser).toHaveBeenCalled());
    const body = vi.mocked(adminApi.createUser).mock.calls[0][0];
    expect(body).toMatchObject({ role: 'ARTIST', fullName: 'Nila Menon', email: 'nila@example.com', displayName: 'Nila Studio', approveNow: true });
    expect(String(body.password)).toHaveLength(14);
    expect((await screen.findAllByText('Account created')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/nila@example.com/).length).toBeGreaterThan(0); // credentials shown to share
  });
});

describe('delete account (admin)', () => {
  it('requires a reason and typing DELETE before deleting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteAccountButton userId="u9" name="Ravi" isArtist />, { user: admin });
    await user.click(screen.getByRole('button', { name: 'Delete Ravi' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/artworks are archived/)).toBeInTheDocument();
    const confirm = within(dialog).getByRole('button', { name: 'Delete account' });
    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByLabelText('Reason for deletion'), 'Policy violation');
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Type DELETE to confirm'), 'delete');
    expect(confirm).toBeDisabled(); // must match exactly
    await user.clear(within(dialog).getByLabelText('Type DELETE to confirm'));
    await user.type(within(dialog).getByLabelText('Type DELETE to confirm'), 'DELETE');
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    await waitFor(() => expect(adminApi.deleteUser).toHaveBeenCalledWith('u9', 'Policy violation'));
  });

  it('can be disabled (e.g. for your own account)', () => {
    renderWithProviders(<DeleteAccountButton userId="me" name="Me" disabled />, { user: admin });
    expect(screen.getByRole('button', { name: 'Delete Me' })).toBeDisabled();
  });
});

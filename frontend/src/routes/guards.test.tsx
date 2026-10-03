import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { admin, customer, renderWithProviders } from '@/test/utils';
import { RequireAuth, RequireRole } from './guards';

const loc = () => screen.getAllByTestId('location')[0].textContent;

describe('route guards', () => {
  it('redirects anonymous users to login with a next parameter', () => {
    renderWithProviders(
      <RequireAuth>
        <p>secret</p>
      </RequireAuth>,
      { user: null, route: '/account/orders?page=2' },
    );
    expect(screen.queryByText('secret')).toBeNull();
    expect(loc()).toBe('/login?next=%2Faccount%2Forders%3Fpage%3D2');
  });

  it('renders protected content for signed-in users', () => {
    renderWithProviders(
      <RequireAuth>
        <p>secret</p>
      </RequireAuth>,
      { user: customer, route: '/account' },
    );
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('sends users without the role to /forbidden', () => {
    renderWithProviders(
      <RequireRole role="ADMIN">
        <p>admin area</p>
      </RequireRole>,
      { user: customer, route: '/admin' },
    );
    expect(screen.queryByText('admin area')).toBeNull();
    expect(loc()).toBe('/forbidden');
  });

  it('allows users with the role', () => {
    renderWithProviders(
      <RequireRole role="ADMIN">
        <p>admin area</p>
      </RequireRole>,
      { user: admin, route: '/admin' },
    );
    expect(screen.getByText('admin area')).toBeInTheDocument();
  });
});

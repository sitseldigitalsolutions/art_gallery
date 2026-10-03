import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { App as AntApp } from 'antd';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthContext';
import type { AuthUser } from '@/lib/types';

export const customer: AuthUser = { id: 'u1', email: 'c@test.local', fullName: 'Test Customer', roles: ['CUSTOMER'], artistId: null, artistStatus: null };
export const admin: AuthUser = { id: 'a1', email: 'a@test.local', fullName: 'Test Admin', roles: ['ADMIN'], artistId: null, artistStatus: null };

export function LocationProbe() {
  const l = useLocation();
  return <div data-testid="location">{l.pathname + l.search}</div>;
}

export function renderWithProviders(ui: ReactElement, opts: { user?: AuthUser | null; route?: string; path?: string } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[opts.route ?? '/']}>
        <AuthProvider initialUser={opts.user ?? null}>
          <AntApp>
            <Routes>
              <Route path={opts.path ?? '*'} element={ui} />
              <Route path="/login" element={<LocationProbe />} />
              <Route path="/forbidden" element={<LocationProbe />} />
            </Routes>
            <LocationProbe />
          </AntApp>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

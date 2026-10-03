import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { refreshSession, tokenStore } from '@/lib/api';
import type { AuthUser, Role } from '@/lib/types';
import { authApi, type ArtistRegisterInput, type AuthResponse, type RegisterInput } from './api';

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  registerArtist: (input: ArtistRegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  hasRole: (role: Role) => boolean;
  reload: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser?: AuthUser | null }) {
  const [user, setUser] = useState<AuthUser | null>(initialUser ?? null);
  const [ready, setReady] = useState(initialUser !== undefined);
  const qc = useQueryClient();

  useEffect(() => tokenStore.onSessionChange((u) => setUser(u)) as unknown as () => void, []);

  useEffect(() => {
    if (initialUser !== undefined) return;
    refreshSession().finally(() => setReady(true));
  }, [initialUser]);

  const accept = useCallback(
    (res: AuthResponse) => {
      tokenStore.set(res.accessToken);
      setUser(res.user);
      qc.invalidateQueries();
      return res.user;
    },
    [qc],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      login: async (email, password) => accept(await authApi.login(email, password)),
      register: async (input) => accept(await authApi.register(input)),
      registerArtist: async (input) => accept(await authApi.registerArtist(input)),
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          tokenStore.set(null);
          setUser(null);
          qc.clear();
        }
      },
      hasRole: (role) => !!user?.roles.includes(role),
      reload: async () => {
        await refreshSession();
      },
    }),
    [user, ready, accept, qc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

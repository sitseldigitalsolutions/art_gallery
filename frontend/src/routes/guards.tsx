import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import type { Role } from '@/lib/types';

function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink" role="status" aria-label="Loading">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-brand" />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <FullPageLoader />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <>{children}</>;
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, ready, hasRole } = useAuth();
  const location = useLocation();
  if (!ready) return <FullPageLoader />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (!hasRole(role)) return <Navigate to="/forbidden" replace />;
  return <>{children}</>;
}

export { FullPageLoader };

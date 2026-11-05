import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/** Require pharmacy session; wait for zustand persist hydrate. */
export default function PharmacyAuthGuard({ children }) {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  if (!hydrated) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p style={{ color: 'var(--pharm-muted)' }}>Загрузка…</p>
      </main>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

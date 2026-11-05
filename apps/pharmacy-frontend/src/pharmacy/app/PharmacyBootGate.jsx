import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { PHARM_DASHBOARD_PATH } from './pharmacyPaths';

/**
 * Silent hydrate + route unauth users to /login without painting admin chrome first.
 */
export default function PharmacyBootGate({ children }) {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  if (!hydrated) {
    return null;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

/** `/` and unknown paths — login or dashboard, no intermediate «Загрузка». */
export function PharmacyRootRedirect() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  if (!hydrated) return null;
  if (!token) return <Navigate to="/login" replace />;
  return <Navigate to={PHARM_DASHBOARD_PATH} replace />;
}

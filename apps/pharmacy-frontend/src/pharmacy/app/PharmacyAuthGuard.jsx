import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isLeavingToMainLogin } from '../../utils/leaveToMainLogin';
import { PHARM_POS_PATH } from './pharmacyPaths';

export default function PharmacyAuthGuard({ children, requireOffice = false }) {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  if (!hydrated) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p style={{ color: 'var(--pharm-muted)' }}>Загрузка…</p>
      </main>
    );
  }

  if (!token) {
    if (isLeavingToMainLogin()) return null;
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireOffice && user?.role === 'CASHIER') {
    return <Navigate to={PHARM_POS_PATH} replace />;
  }

  return children;
}

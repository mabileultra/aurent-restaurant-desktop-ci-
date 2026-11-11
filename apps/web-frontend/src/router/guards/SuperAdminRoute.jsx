import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isPlatformUser } from '../../utils/platformRoles';

export default function SuperAdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (import.meta.env.DEV && location.pathname.startsWith('/platform/ui-kit')) {
    return children;
  }

  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (!isPlatformUser(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

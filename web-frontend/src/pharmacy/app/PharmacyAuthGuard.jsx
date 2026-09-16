import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function PharmacyAuthGuard({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/platform" replace />;
  }
  return children;
}

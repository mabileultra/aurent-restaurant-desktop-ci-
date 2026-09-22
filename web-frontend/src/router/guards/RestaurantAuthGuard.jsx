import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isPlatformUser } from '../../utils/platformRoles';

/** Auth gate before cross-origin handoff to r-aurent. */
export default function RestaurantAuthGuard({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (isPlatformUser(user?.role)) {
    return <Navigate to="/platform" replace />;
  }
  return children;
}

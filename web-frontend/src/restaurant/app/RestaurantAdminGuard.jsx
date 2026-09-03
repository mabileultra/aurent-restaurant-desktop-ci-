import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGER']);

export default function RestaurantAdminGuard({ children }) {
  const user = useAuthStore((s) => s.user);
  const { hasModule } = useModuleAccess();

  if (user?.role === 'WAITER' || user?.role === 'CASHIER') {
    return <Navigate to="/rst/pos" replace />;
  }
  if (user?.role === 'COOK') {
    return <Navigate to="/rst/kitchen" replace />;
  }
  if (!ADMIN_ROLES.has(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (!hasModule('restaurantFloor')) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

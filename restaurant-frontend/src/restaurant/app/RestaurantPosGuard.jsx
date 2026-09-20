import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';

const POS_ROLES = new Set(['ADMIN', 'MANAGER', 'WAITER', 'CASHIER']);

export default function RestaurantPosGuard({ children }) {
  const user = useAuthStore((s) => s.user);
  const { hasModule } = useModuleAccess();

  if (user?.role === 'COOK') {
    return <Navigate to="/rst/kitchen" replace />;
  }
  if (!POS_ROLES.has(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (!hasModule('restaurantPos') && !hasModule('restaurantFloor')) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

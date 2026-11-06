import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';

const KITCHEN_ROLES = new Set(['ADMIN', 'MANAGER', 'COOK', 'WAITER', 'CASHIER']);

export default function RestaurantKitchenGuard({ children }) {
  const user = useAuthStore((s) => s.user);
  const { hasModule } = useModuleAccess();

  if (!KITCHEN_ROLES.has(user?.role)) {
    return <Navigate to="/login" replace />;
  }
  if (!hasModule('restaurantKitchen') && !hasModule('restaurantFloor')) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

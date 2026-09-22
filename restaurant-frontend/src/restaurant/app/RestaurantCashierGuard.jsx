import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { usesCashierPos } from '../pos/cashier/utils/cashierNav';

/**
 * Dedicated cashier POS — CASHIER / ADMIN / MANAGER only.
 */
export default function RestaurantCashierGuard({ children }) {
  const user = useAuthStore((s) => s.user);
  const { hasModule } = useModuleAccess();

  if (user?.role === 'COOK') {
    return <Navigate to="/rst/kitchen" replace />;
  }
  if (user?.role === 'WAITER') {
    return <Navigate to="/rst/pos" replace />;
  }
  if (!usesCashierPos(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (!hasModule('restaurantPos') && !hasModule('restaurantFloor')) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

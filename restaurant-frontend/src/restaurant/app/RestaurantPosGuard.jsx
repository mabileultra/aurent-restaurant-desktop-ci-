import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';

const FLOOR_ROLES = new Set(['ADMIN', 'MANAGER', 'WAITER', 'CASHIER']);

/**
 * Waiter / floor POS at /rst/pos.
 * Pure CASHIER is sent to dedicated /rst/cashier.
 * ADMIN/MANAGER may open both screens.
 */
export default function RestaurantPosGuard({ children }) {
  const user = useAuthStore((s) => s.user);
  const { hasModule } = useModuleAccess();
  const role = String(user?.role || '').toUpperCase();

  if (role === 'COOK') {
    return <Navigate to="/rst/kitchen" replace />;
  }
  if (role === 'CASHIER') {
    return <Navigate to="/rst/cashier" replace />;
  }
  if (!FLOOR_ROLES.has(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (!hasModule('restaurantPos') && !hasModule('restaurantFloor')) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

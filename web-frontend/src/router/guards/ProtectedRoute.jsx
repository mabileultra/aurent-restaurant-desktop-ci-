import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { resolveRoleHomePath } from '../../utils/roleHomePath';

/**
 * Защита маршрута.
 * Если указан module — решают права модулей (в т.ч. выданные супер-админом).
 * requiredRole используется только когда module не задан (legacy).
 */
export default function ProtectedRoute({ children, requiredRole, module: moduleId }) {
  const { isAuthenticated, user } = useAuthStore();
  const { hasModule } = useModuleAccess();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role === 'SUPER_ADMIN') return <Navigate to="/platform" replace />;
  if (user?.role === 'CASHIER' || user?.role === 'WAITER') {
    return <Navigate to="/cashier" replace />;
  }

  const homePath = resolveRoleHomePath(user?.role);

  if (moduleId) {
    if (!hasModule(moduleId)) {
      return <Navigate to={homePath} replace />;
    }
    return children;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'ADMIN') {
    return <Navigate to={homePath} replace />;
  }

  return children;
}

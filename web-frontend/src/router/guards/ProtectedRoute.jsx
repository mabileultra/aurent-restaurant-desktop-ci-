import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { resolveRoleHomePath } from '../../utils/roleHomePath';

export default function ProtectedRoute({ children, requiredRole, module: moduleId }) {
  const { isAuthenticated, user } = useAuthStore();
  const { hasModule } = useModuleAccess();
  if (!isAuthenticated()) {
    // Корень сайта → вход. Скачивание кассы — отдельно на /install.
    return <Navigate to="/login" replace />;
  }
  if (user?.role === 'SUPER_ADMIN') return <Navigate to="/platform" replace />;
  if (user?.role === 'CASHIER' || user?.role === 'WAITER') {
    return <Navigate to="/cashier" replace />;
  }
  const homePath = resolveRoleHomePath(user?.role);
  if (requiredRole && user?.role !== requiredRole && !['ADMIN'].includes(user?.role)) {
    return <Navigate to={homePath} replace />;
  }
  if (moduleId && !hasModule(moduleId)) {
    return <Navigate to={homePath} replace />;
  }
  return children;
}

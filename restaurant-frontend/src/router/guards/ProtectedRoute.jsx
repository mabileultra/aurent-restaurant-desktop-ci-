import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isPlatformUser } from '../../utils/platformRoles';
import { redirectPlatformUserToMainApp } from '../../utils/redirectPlatformUser';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { resolveRoleHomePath } from '../../utils/roleHomePath';

/**
 * Restaurant SPA route guard.
 * Platform → main app. Floor roles → /rst/pos.
 */
export default function ProtectedRoute({ children, requiredRole, module: moduleId }) {
  const { isAuthenticated, user } = useAuthStore();
  const { hasModule } = useModuleAccess();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (isPlatformUser(user?.role)) {
    redirectPlatformUserToMainApp();
    return null;
  }
  if (user?.role === 'CASHIER' || user?.role === 'WAITER') {
    return <Navigate to="/rst/pos" replace />;
  }
  if (user?.role === 'COOK') {
    return <Navigate to="/rst/kitchen" replace />;
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

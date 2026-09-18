import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { firstPlatformPath } from '../../features/platform/nav/platformNav';
import { isSuperAdminRole } from '../../utils/platformRoles';
import PlatformNoAccessPage from '../../features/platform/pages/PlatformNoAccessPage';

export default function PlatformHomeRedirect() {
  const role = useAuthStore((s) => s.user?.role);
  const { hasModule } = useModuleAccess();
  if (isSuperAdminRole(role)) {
    return <Navigate to="/platform/companies" replace />;
  }
  const path = firstPlatformPath(role, hasModule);
  if (path === '/platform') {
    return <PlatformNoAccessPage />;
  }
  return <Navigate to={path} replace />;
}

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { canOpenPlatformPath, firstPlatformPath } from '../../features/platform/nav/platformNav';

export default function PlatformPageGuard({ children }) {
  const location = useLocation();
  const role = useAuthStore((s) => s.user?.role);
  const { hasModule } = useModuleAccess();

  if (canOpenPlatformPath(role, hasModule, location.pathname)) {
    return children;
  }
  return <Navigate to={firstPlatformPath(role, hasModule)} replace />;
}

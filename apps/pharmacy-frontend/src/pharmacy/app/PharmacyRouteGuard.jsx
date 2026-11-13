import { Navigate, Route } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { PHARM_POS_PATH } from './pharmacyPaths';
import { isPharmacyRouteAllowed, resolvePharmacyHomePath } from './pharmacyRouteAccess';

export function PharmacyRouteGuard({
  children,
  module,
  anyModules,
  roles,
}) {
  const user = useAuthStore((s) => s.user);
  const { hasModule, hasAnyModule } = useModuleAccess();

  if (user?.role === 'CASHIER') {
    return <Navigate to={PHARM_POS_PATH} replace />;
  }

  if (!isPharmacyRouteAllowed({
    user,
    hasModule,
    hasAnyModule,
    module,
    anyModules,
    roles,
  })) {
    return <Navigate to={resolvePharmacyHomePath(user, hasModule)} replace />;
  }

  return children;
}

export function PharmacyPosGuard({ children }) {
  const user = useAuthStore((s) => s.user);
  const { hasModule } = useModuleAccess();

  if (user?.role === 'ACCOUNTANT' && !hasModule('cashierPos')) {
    return <Navigate to={resolvePharmacyHomePath(user, hasModule)} replace />;
  }

  return children;
}

export function PharmacyHomeRedirect() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const { hasModule } = useModuleAccess();

  if (!hydrated) {
    return null;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={resolvePharmacyHomePath(user, hasModule)} replace />;
}

export function renderGuardedRoutes(routes) {
  return routes.map(({ path, Component, ...access }) => (
    <Route
      key={path}
      path={path}
      element={(
        <PharmacyRouteGuard {...access}>
          <Component />
        </PharmacyRouteGuard>
      )}
    />
  ));
}

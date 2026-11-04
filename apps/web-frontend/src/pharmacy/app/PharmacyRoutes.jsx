import { Navigate, Outlet, Route } from 'react-router-dom';
import PharmacyAuthGuard from './PharmacyAuthGuard';
import PharmacyPosGuard from './PharmacyPosGuard';
import CashierRoute from '../../router/guards/CashierRoute';
import BillingAccessGuard from '../../router/guards/BillingAccessGuard';
import CashierLayout from '../../components/layout/CashierLayout';
import { PharmacyPosPage } from '../../router/lazyPages';
import { PHARM_POS_PATH } from './pharmacyPaths';

/**
 * Аптечный UI-мир: `/pharm/**`.
 * POS использует CashierLayout (как раньше `/cashier/pharmacy`).
 * Складские страницы монтируются в admin.routes под AppShell.
 */
export const pharmacyRoutes = (
  <Route
    path="/pharm"
    element={(
      <PharmacyAuthGuard>
        <Outlet />
      </PharmacyAuthGuard>
    )}
  >
    <Route index element={<Navigate to={PHARM_POS_PATH} replace />} />
    <Route
      path="pos"
      element={(
        <CashierRoute>
          <CashierLayout />
        </CashierRoute>
      )}
    >
      <Route
        index
        element={(
          <PharmacyPosGuard>
            <BillingAccessGuard>
              <PharmacyPosPage />
            </BillingAccessGuard>
          </PharmacyPosGuard>
        )}
      />
    </Route>
  </Route>
);

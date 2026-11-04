import { Navigate, Route, Routes } from 'react-router-dom';
import AuthAcceptPage from '../../features/auth/pages/AuthAcceptPage';
import LoginPage from '../../features/auth/pages/LoginPage';
import PharmacyAuthGuard from './PharmacyAuthGuard';
import PharmacyFoundationPage from './PharmacyFoundationPage';
import { PHARM_HOME_PATH, PHARM_POS_PATH, PHARM_STOCK_PRODUCTS_PATH } from './pharmacyPaths';

/**
 * Pharmacy UI world on p-aurent.uz.
 * Sprint 2: auth accept (code exchange) + guarded shell.
 */
export function PharmacyRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/accept" element={<AuthAcceptPage />} />
      <Route
        path={PHARM_HOME_PATH}
        element={(
          <PharmacyAuthGuard>
            <PharmacyFoundationPage />
          </PharmacyAuthGuard>
        )}
      />
      <Route
        path={PHARM_POS_PATH}
        element={(
          <PharmacyAuthGuard>
            <PharmacyFoundationPage section="pos" />
          </PharmacyAuthGuard>
        )}
      />
      <Route
        path={PHARM_STOCK_PRODUCTS_PATH}
        element={(
          <PharmacyAuthGuard>
            <PharmacyFoundationPage section="stock" />
          </PharmacyAuthGuard>
        )}
      />
      <Route path="*" element={<Navigate to={PHARM_HOME_PATH} replace />} />
    </Routes>
  );
}

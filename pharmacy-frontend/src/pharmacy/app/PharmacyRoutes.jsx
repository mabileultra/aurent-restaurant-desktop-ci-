import { Navigate, Route, Routes } from 'react-router-dom';
import PharmacyFoundationPage from './PharmacyFoundationPage';
import { PHARM_HOME_PATH, PHARM_POS_PATH, PHARM_STOCK_PRODUCTS_PATH } from './pharmacyPaths';

/**
 * Pharmacy UI world on p-aurent.uz.
 * Sprint 1: foundation shell only — modules land in later sprints.
 */
export function PharmacyRoutes() {
  return (
    <Routes>
      <Route path={PHARM_HOME_PATH} element={<PharmacyFoundationPage />} />
      <Route path={PHARM_POS_PATH} element={<PharmacyFoundationPage section="pos" />} />
      <Route path={PHARM_STOCK_PRODUCTS_PATH} element={<PharmacyFoundationPage section="stock" />} />
      <Route path="*" element={<Navigate to={PHARM_HOME_PATH} replace />} />
    </Routes>
  );
}

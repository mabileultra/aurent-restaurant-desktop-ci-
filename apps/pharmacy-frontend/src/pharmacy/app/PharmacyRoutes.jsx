import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthAcceptPage from '../../features/auth/pages/AuthAcceptPage';
import LoginPage from '../../features/auth/pages/LoginPage';
import PharmacyPosShell from '../pos/PharmacyPosShell';
import PharmacyAuthGuard from './PharmacyAuthGuard';
import PharmacyAdminShell from './PharmacyAdminShell';
import {
  PHARM_DASHBOARD_PATH,
  PHARM_HOME_PATH,
  PHARM_POS_PATH,
  PHARM_RETURNS_PATH,
  PHARM_SALES_PATH,
  PHARM_STOCK_PATHS,
} from './pharmacyPaths';

const PharmacyPosPage = lazy(() => import('../../features/pharmacy-cashier/pages/PharmacyPosPage'));
const PharmacyProductsPage = lazy(() => import('../../features/pharmacy-stock/pages/PharmacyProductsPage'));
const PharmacyReceiptsPage = lazy(() => import('../../features/pharmacy-stock/pages/PharmacyReceiptsPage'));
const PharmacyReceiptDocumentPage = lazy(() => import('../../features/pharmacy-stock/pages/PharmacyReceiptDocumentPage'));
const PharmacyReceiptPickPage = lazy(() => import('../../features/pharmacy-stock/pages/PharmacyReceiptPickPage'));
const PharmacyAslWithdrawMonitorPage = lazy(() => import('../../features/pharmacy-stock/pages/PharmacyAslWithdrawMonitorPage'));
const PharmacyAslRequestLogPage = lazy(() => import('../../features/pharmacy-stock/pages/PharmacyAslRequestLogPage'));
const ReturnsPage = lazy(() => import('../../features/sales/pages/ReturnsPage'));
const SalesLedgerPage = lazy(() => import('../../features/sales/pages/SalesLedgerPage'));
const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage'));

function Fall() {
  return <div className="p-6 text-slate-500">Загрузка…</div>;
}

function Authed({ children }) {
  return <PharmacyAuthGuard>{children}</PharmacyAuthGuard>;
}

/**
 * Pharmacy product routes on p-aurent.uz.
 * Phase 4: own PharmacyPosShell (not grocery CashierLayout).
 */
export function PharmacyRoutes() {
  return (
    <Suspense fallback={<Fall />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/accept" element={<AuthAcceptPage />} />

        <Route
          path={PHARM_POS_PATH}
          element={(
            <Authed>
              <PharmacyPosShell />
            </Authed>
          )}
        >
          <Route index element={<PharmacyPosPage />} />
        </Route>

        <Route
          element={(
            <Authed>
              <PharmacyAdminShell />
            </Authed>
          )}
        >
          <Route path={PHARM_HOME_PATH} element={<Navigate to={PHARM_DASHBOARD_PATH} replace />} />
          <Route path={PHARM_DASHBOARD_PATH} element={<DashboardPage />} />
          <Route path={PHARM_STOCK_PATHS.products} element={<PharmacyProductsPage />} />
          <Route path={PHARM_STOCK_PATHS.receipts} element={<PharmacyReceiptsPage />} />
          <Route path={PHARM_STOCK_PATHS.receiptsNew} element={<PharmacyReceiptDocumentPage />} />
          <Route path="/stock/receipts/:id" element={<PharmacyReceiptDocumentPage />} />
          <Route path="/stock/receipts/:id/pick" element={<PharmacyReceiptPickPage />} />
          <Route path={PHARM_STOCK_PATHS.aslMarks} element={<PharmacyAslWithdrawMonitorPage />} />
          <Route path={PHARM_STOCK_PATHS.aslRequests} element={<PharmacyAslRequestLogPage />} />
          <Route path={PHARM_SALES_PATH} element={<SalesLedgerPage />} />
          <Route path={PHARM_RETURNS_PATH} element={<ReturnsPage />} />
        </Route>

        <Route path="*" element={<Navigate to={PHARM_DASHBOARD_PATH} replace />} />
      </Routes>
    </Suspense>
  );
}

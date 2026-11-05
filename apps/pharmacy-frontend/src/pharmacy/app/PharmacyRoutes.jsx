import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthAcceptPage from '../../features/auth/pages/AuthAcceptPage';
import LoginPage from '../../features/auth/pages/LoginPage';
import PharmacyPosShell from '../pos/PharmacyPosShell';
import PharmacyAuthGuard from './PharmacyAuthGuard';
import PharmacyAdminShell from './PharmacyAdminShell';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import {
  PHARM_DASHBOARD_PATH,
  PHARM_HOME_PATH,
  PHARM_POS_PATH,
  PHARM_RETURNS_PATH,
  PHARM_SALES_PATH,
  PHARM_STOCK_PATHS,
} from './pharmacyPaths';
import { pharmacyReportRoutes } from './pharmacyReportRoutes';
import { pharmacyOfficeRoutes } from './pharmacyOfficeRoutes';

const PharmacyPosPage = lazy(() => import('../../features/pharmacy-cashier/pages/PharmacyPosPage'));
const PharmacyProductsPage = lazy(() => import('../../features/pharmacy-stock/pages/PharmacyProductsPage'));
const PharmacyReceiptsPage = lazy(() => import('../../features/pharmacy-stock/pages/PharmacyReceiptsPage'));
const PharmacyReceiptDocumentPage = lazy(() => import('../../features/pharmacy-stock/pages/PharmacyReceiptDocumentPage'));
const StockInventoryCreatePage = lazy(() => import('../../features/stock/pages/StockInventoryCreatePage'));
const StockTransferCreatePage = lazy(() => import('../../features/stock/pages/StockTransferCreatePage'));
const SuppliersPage = lazy(() => import('../../features/catalog/pages/SuppliersPage'));
const AiAssistantPage = lazy(() => import('../../features/ai/pages/AiAssistantPage'));
const HandbookPage = lazy(() => import('../../features/handbook/pages/HandbookPage'));
const SupportPage = lazy(() => import('../../features/support/pages/SupportPage'));
const ReturnsPage = lazy(() => import('../../features/sales/pages/ReturnsPage'));
const SalesLedgerPage = lazy(() => import('../../features/sales/pages/SalesLedgerPage'));

function Authed({ children }) {
  return <PharmacyAuthGuard>{children}</PharmacyAuthGuard>;
}

/**
 * Pharmacy product routes on p-aurent.uz.
 * Lazy pages suspend inside shell Outlet — not the whole tree.
 */
export function PharmacyRoutes() {
  return (
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
        <Route path="/assistant" element={<AiAssistantPage />} />
        <Route path="/handbook" element={<HandbookPage scope="admin" />} />
        <Route path="/handbook/:moduleId" element={<HandbookPage scope="admin" />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path={PHARM_STOCK_PATHS.products} element={<PharmacyProductsPage />} />
        <Route path={PHARM_STOCK_PATHS.receipts} element={<PharmacyReceiptsPage />} />
        <Route path={PHARM_STOCK_PATHS.receiptsNew} element={<PharmacyReceiptDocumentPage />} />
        <Route path="/stock/receipts/:id" element={<PharmacyReceiptDocumentPage />} />
        <Route path="/stock/receipts/:id/pick" element={<Navigate to=".." replace />} />
        <Route path="/stock/inventories/new" element={<StockInventoryCreatePage />} />
        <Route path="/stock/transfers/new" element={<StockTransferCreatePage />} />
        <Route path="/stock/suppliers" element={<SuppliersPage />} />
        <Route path={PHARM_SALES_PATH} element={<SalesLedgerPage />} />
        <Route path={PHARM_RETURNS_PATH} element={<ReturnsPage />} />
        {pharmacyReportRoutes()}
        {pharmacyOfficeRoutes()}
      </Route>

      <Route path="*" element={<Navigate to={PHARM_DASHBOARD_PATH} replace />} />
    </Routes>
  );
}

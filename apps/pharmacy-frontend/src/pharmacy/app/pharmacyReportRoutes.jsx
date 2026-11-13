import { lazy } from 'react';
import { renderGuardedRoutes } from './PharmacyRouteGuard';
import { PHARMACY_REPORT_MODULES } from './pharmacyRouteAccess';

const ReportsHubPage = lazy(() => import('../../features/reports/pages/ReportsHubPage'));
const ProductSalesReportPage = lazy(() => import('../../features/reports/pages/ProductSalesReportPage'));
const StoreSalesReportPage = lazy(() => import('../../features/reports/pages/StoreSalesReportPage'));
const DailySummaryReportPage = lazy(() => import('../../features/reports/pages/DailySummaryReportPage'));
const CashierPerformanceReportPage = lazy(() => import('../../features/reports/pages/CashierPerformanceReportPage'));
const LowStockReportPage = lazy(() => import('../../features/reports/pages/LowStockReportPage'));
const StockReceiptsReportPage = lazy(() => import('../../features/reports/pages/StockReceiptsReportPage'));
const StockBalancesReportPage = lazy(() => import('../../features/reports/pages/StockBalancesReportPage'));
const StockInventoriesReportPage = lazy(() => import('../../features/reports/pages/StockInventoriesReportPage'));
const StockTransfersReportPage = lazy(() => import('../../features/reports/pages/StockTransfersReportPage'));
const PriceRegistryJournalPage = lazy(() => import('../../features/reports/pages/PriceRegistryJournalPage'));
const DrugRegistryPage = lazy(() => import('../../features/reports/pages/DrugRegistryPage'));
const ReturnsPage = lazy(() => import('../../features/sales/pages/ReturnsPage'));

export const REPORT_ROUTES = [
  { path: '/reports', anyModules: PHARMACY_REPORT_MODULES, Component: ReportsHubPage },
  { path: '/reports/sales/by-products', module: 'reportsSalesByProducts', Component: ProductSalesReportPage },
  { path: '/reports/sales/by-stores', module: 'reportsSalesByStores', Component: StoreSalesReportPage },
  { path: '/reports/sales/daily', module: 'reportsSalesDaily', Component: DailySummaryReportPage },
  { path: '/reports/sales/cashiers', module: 'reportsCashierPerformance', Component: CashierPerformanceReportPage },
  { path: '/reports/returns', module: 'reportsReturns', Component: ReturnsPage },
  { path: '/reports/stock/low', module: 'reportsStockLow', Component: LowStockReportPage },
  { path: '/reports/stock/receipts', module: 'reportsStockReceipts', Component: StockReceiptsReportPage },
  { path: '/reports/stock/balances', module: 'reportsStockBalances', Component: StockBalancesReportPage },
  { path: '/reports/stock/inventories', module: 'reportsStockInventories', Component: StockInventoriesReportPage },
  { path: '/reports/stock/transfers', module: 'reportsStockTransfers', Component: StockTransfersReportPage },
  { path: '/reports/stock/price-registry', module: 'reportsPriceRegistry', Component: PriceRegistryJournalPage },
  { path: '/reports/stock/drug-registry', module: 'reportsDrugRegistry', Component: DrugRegistryPage },
];

/** Pharmacy reports only: sales + stock read-only core. */
export function pharmacyReportRoutes() {
  return <>{renderGuardedRoutes(REPORT_ROUTES)}</>;
}

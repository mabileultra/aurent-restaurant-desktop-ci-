import { lazy } from 'react';
import { Route } from 'react-router-dom';

const ReportsHubPage = lazy(() => import('../../features/reports/pages/ReportsHubPage'));
const ReportsPage = lazy(() => import('../../features/reports/pages/ReportsPage'));
const ProductSalesReportPage = lazy(() => import('../../features/reports/pages/ProductSalesReportPage'));
const CategorySalesReportPage = lazy(() => import('../../features/reports/pages/CategorySalesReportPage'));
const StoreSalesReportPage = lazy(() => import('../../features/reports/pages/StoreSalesReportPage'));
const PeriodCompareReportPage = lazy(() => import('../../features/reports/pages/PeriodCompareReportPage'));
const DailySummaryReportPage = lazy(() => import('../../features/reports/pages/DailySummaryReportPage'));
const CashierPerformanceReportPage = lazy(() => import('../../features/reports/pages/CashierPerformanceReportPage'));
const StockDashboardPage = lazy(() => import('../../features/reports/pages/StockDashboardPage'));
const LowStockReportPage = lazy(() => import('../../features/reports/pages/LowStockReportPage'));
const StockTurnoverPage = lazy(() => import('../../features/reports/pages/StockTurnoverPage'));
const StockMovementsPage = lazy(() => import('../../features/reports/pages/StockMovementsPage'));
const StockReceiptsReportPage = lazy(() => import('../../features/reports/pages/StockReceiptsReportPage'));
const StockBalancesReportPage = lazy(() => import('../../features/reports/pages/StockBalancesReportPage'));
const StockAdjustmentsReportPage = lazy(() => import('../../features/reports/pages/StockAdjustmentsReportPage'));
const DeadStockReportPage = lazy(() => import('../../features/reports/pages/DeadStockReportPage'));
const StockInventoriesReportPage = lazy(() => import('../../features/reports/pages/StockInventoriesReportPage'));
const StockTransfersReportPage = lazy(() => import('../../features/reports/pages/StockTransfersReportPage'));
const ReportingSyncPage = lazy(() => import('../../features/reports/pages/ReportingSyncPage'));
const ReturnsPage = lazy(() => import('../../features/sales/pages/ReturnsPage'));

/** Slim pharmacy reports: sales + stock read-only (no write-offs / lifecycle grocery deps). */
export function pharmacyReportRoutes() {
  return (
    <>
      <Route path="/reports" element={<ReportsHubPage />} />
      <Route path="/reports/analytics" element={<ReportsPage />} />
      <Route path="/reports/sales" element={<ReportsPage />} />
      <Route path="/reports/sales/by-products" element={<ProductSalesReportPage />} />
      <Route path="/reports/sales/by-categories" element={<CategorySalesReportPage />} />
      <Route path="/reports/sales/by-stores" element={<StoreSalesReportPage />} />
      <Route path="/reports/sales/period-compare" element={<PeriodCompareReportPage />} />
      <Route path="/reports/sales/daily" element={<DailySummaryReportPage />} />
      <Route path="/reports/sales/cashiers" element={<CashierPerformanceReportPage />} />
      <Route path="/reports/returns" element={<ReturnsPage />} />
      <Route path="/reports/sync" element={<ReportingSyncPage />} />
      <Route path="/reports/stock" element={<StockDashboardPage />} />
      <Route path="/reports/stock/low" element={<LowStockReportPage />} />
      <Route path="/reports/stock/turnover" element={<StockTurnoverPage />} />
      <Route path="/reports/stock/movements" element={<StockMovementsPage />} />
      <Route path="/reports/stock/receipts" element={<StockReceiptsReportPage />} />
      <Route path="/reports/stock/balances" element={<StockBalancesReportPage />} />
      <Route path="/reports/stock/adjustments" element={<StockAdjustmentsReportPage />} />
      <Route path="/reports/stock/dead" element={<DeadStockReportPage />} />
      <Route path="/reports/stock/inventories" element={<StockInventoriesReportPage />} />
      <Route path="/reports/stock/transfers" element={<StockTransfersReportPage />} />
    </>
  );
}

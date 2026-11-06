import { lazy } from 'react';
import { Route } from 'react-router-dom';

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
const ReturnsPage = lazy(() => import('../../features/sales/pages/ReturnsPage'));

/** Pharmacy reports only: sales + stock read-only core. */
export function pharmacyReportRoutes() {
  return (
    <>
      <Route path="/reports" element={<ReportsHubPage />} />
      <Route path="/reports/sales/by-products" element={<ProductSalesReportPage />} />
      <Route path="/reports/sales/by-stores" element={<StoreSalesReportPage />} />
      <Route path="/reports/sales/daily" element={<DailySummaryReportPage />} />
      <Route path="/reports/sales/cashiers" element={<CashierPerformanceReportPage />} />
      <Route path="/reports/returns" element={<ReturnsPage />} />
      <Route path="/reports/stock/low" element={<LowStockReportPage />} />
      <Route path="/reports/stock/receipts" element={<StockReceiptsReportPage />} />
      <Route path="/reports/stock/balances" element={<StockBalancesReportPage />} />
      <Route path="/reports/stock/inventories" element={<StockInventoriesReportPage />} />
      <Route path="/reports/stock/transfers" element={<StockTransfersReportPage />} />
      <Route path="/reports/stock/price-registry" element={<PriceRegistryJournalPage />} />
    </>
  );
}

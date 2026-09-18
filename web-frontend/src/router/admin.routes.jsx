import { Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './guards/ProtectedRoute';
import CheckoutRedirect from './guards/CheckoutRedirect';
import AppShellLayout from '../components/layout/AppShellLayout';
import PharmacyStockReceiptRedirect from '../features/pharmacy-stock/components/PharmacyStockReceiptRedirect';
import PharmacyTenantGuard from '../features/pharmacy-stock/components/PharmacyTenantGuard';
import { PHARMACY_STOCK_PATHS } from '../features/pharmacy-stock/pharmacyStockPaths';

function PharmacyStockLegacyRedirect() {
  const { pathname } = useLocation();
  const next = pathname.replace(/^\/pharmacy\/stock/, '/pharm/stock');
  return <Navigate to={next || '/pharm/stock/products'} replace />;
}
import {
  DashboardPage,
  AiAssistantPage,
  ProductsPage,
  CategoriesPage,
  StockProductsPage,
  StockReceiptCreatePage,
  PharmacyReceiptsPage,
  PharmacyReceiptDocumentPage,
  PharmacyReceiptPickPage,
  PharmacyProductsPage,
  PharmacyAslWithdrawMonitorPage,
  StockInventoryCreatePage,
  StockTransferCreatePage,
  SuppliersPage,
  OrdersListPage,
  SalesLedgerPage,
  ReturnsPage,
  ReportsPage,
  ReportsHubPage,
  ProductSalesReportPage,
  CategorySalesReportPage,
  StoreSalesReportPage,
  PeriodCompareReportPage,
  DailySummaryReportPage,
  CashierPerformanceReportPage,
  StockDashboardPage,
  WriteOffsReportPage,
  LowStockReportPage,
  StockTurnoverPage,
  StockMovementsPage,
  StockReceiptsReportPage,
  StockBalancesReportPage,
  StockAdjustmentsReportPage,
  DeadStockReportPage,
  StockInventoriesReportPage,
  StockTransfersReportPage,
  ProductLifecycleReportPage,
  ReportingSyncPage,
  FinanceDashboardPage,
  FinanceAccountsPage,
  FinanceIncomesPage,
  FinanceExpensesPage,
  FinanceReportsPage,
  FinanceCategoriesPage,
  FinanceDebtsPage,
  FinanceTransfersPage,
  FinanceAuditPage,
  FinanceSyncPage,
  CashRegistersListPage,
  ZReportsPage,
  CashRegisterTransferPage,
  CashRegisterConfigPage,
  StoresPage,
  UsersPage,
  UsersPrinterSettingsPage,
  UsersBrandingSettingsPage,
  UsersBarcodePrintPage,
  ScalesStationPage,
  ScalesPluPage,
  HandbookPage,
  SupportPage,
  TenantBillingPage,
} from './lazyPages';

export const adminRoutes = (
  <Route
    element={(
      <ProtectedRoute>
        <AppShellLayout />
      </ProtectedRoute>
    )}
  >
    <Route
      path="dashboard"
      element={(
        <ProtectedRoute module="dashboard">
          <DashboardPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="assistant"
      element={(
        <ProtectedRoute requiredRole="ADMIN" module="aiAssistant">
          <AiAssistantPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="products"
      element={(
        <ProtectedRoute module="products">
          <PharmacyStockReceiptRedirect to={PHARMACY_STOCK_PATHS.products}>
            <ProductsPage />
          </PharmacyStockReceiptRedirect>
        </ProtectedRoute>
      )}
    />
    <Route
      path="categories"
      element={(
        <ProtectedRoute module="categories">
          <PharmacyStockReceiptRedirect to={PHARMACY_STOCK_PATHS.products}>
            <CategoriesPage />
          </PharmacyStockReceiptRedirect>
        </ProtectedRoute>
      )}
    />
    <Route
      path="scales/station"
      element={(
        <ProtectedRoute module="scalesStation">
          <PharmacyStockReceiptRedirect to={PHARMACY_STOCK_PATHS.products}>
            <ScalesStationPage />
          </PharmacyStockReceiptRedirect>
        </ProtectedRoute>
      )}
    />
    <Route
      path="scales/plu"
      element={(
        <ProtectedRoute module="scalesPlu">
          <PharmacyStockReceiptRedirect to={PHARMACY_STOCK_PATHS.products}>
            <ScalesPluPage />
          </PharmacyStockReceiptRedirect>
        </ProtectedRoute>
      )}
    />
    <Route
      path="stock/products"
      element={(
        <ProtectedRoute module="stockProducts">
          <PharmacyStockReceiptRedirect to={PHARMACY_STOCK_PATHS.products}>
            <StockProductsPage />
          </PharmacyStockReceiptRedirect>
        </ProtectedRoute>
      )}
    />
    <Route
      path="stock/receipts/new"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="stockReceipts">
          <PharmacyStockReceiptRedirect>
            <StockReceiptCreatePage />
          </PharmacyStockReceiptRedirect>
        </ProtectedRoute>
      )}
    />
    <Route
      path="pharm/stock/receipts"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="stockReceipts">
          <PharmacyTenantGuard>
            <PharmacyReceiptsPage />
          </PharmacyTenantGuard>
        </ProtectedRoute>
      )}
    />
    <Route
      path="pharm/stock/receipts/:id"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="stockReceipts">
          <PharmacyTenantGuard>
            <PharmacyReceiptDocumentPage />
          </PharmacyTenantGuard>
        </ProtectedRoute>
      )}
    />
    <Route
      path="pharm/stock/receipts/:id/pick"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="stockReceipts">
          <PharmacyTenantGuard>
            <PharmacyReceiptPickPage />
          </PharmacyTenantGuard>
        </ProtectedRoute>
      )}
    />
    <Route
      path="pharm/stock/products"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="stockProducts">
          <PharmacyTenantGuard>
            <PharmacyProductsPage />
          </PharmacyTenantGuard>
        </ProtectedRoute>
      )}
    />
    <Route
      path="pharm/stock/asl-marks"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="stockReceipts">
          <PharmacyTenantGuard>
            <PharmacyAslWithdrawMonitorPage />
          </PharmacyTenantGuard>
        </ProtectedRoute>
      )}
    />
    <Route path="pharmacy/stock/*" element={<PharmacyStockLegacyRedirect />} />
    <Route
      path="stock/inventories/new"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="stockInventories">
          <StockInventoryCreatePage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="stock/transfers/new"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="stockTransfers">
          <StockTransferCreatePage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="stock/suppliers"
      element={(
        <ProtectedRoute module="stockSuppliers">
          <SuppliersPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="orders/list"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="ordersList">
          <OrdersListPage />
        </ProtectedRoute>
      )}
    />
    <Route path="orders" element={<Navigate to="/orders/list" replace />} />
    <Route path="checkout" element={<CheckoutRedirect />} />
    <Route
      path="reports/sales/by-products"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsSalesByProducts">
          <ProductSalesReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sales/by-categories"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsSalesByCategories">
          <CategorySalesReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sales/by-stores"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsSalesByStores">
          <StoreSalesReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sales/period-compare"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsSalesPeriodCompare">
          <PeriodCompareReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sales/daily"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsSalesDaily">
          <DailySummaryReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sales/cashiers"
      element={(
        <ProtectedRoute requiredRole="ADMIN" module="reportsCashierPerformance">
          <CashierPerformanceReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sales"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsSales">
          <SalesLedgerPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/returns"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsReturns">
          <ReturnsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sync"
      element={(
        <ProtectedRoute module="reportsSync">
          <ReportingSyncPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/analytics"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsAnalytics">
          <ReportsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/write-offs"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockWriteOffs">
          <WriteOffsReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/low"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockLow">
          <LowStockReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/turnover"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockTurnover">
          <StockTurnoverPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/movements"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockMovements">
          <StockMovementsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/receipts"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockReceipts">
          <StockReceiptsReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/balances"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockBalances">
          <StockBalancesReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/adjustments"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockAdjustments">
          <StockAdjustmentsReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/dead"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockDead">
          <DeadStockReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/inventories"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockInventories">
          <StockInventoriesReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/transfers"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockTransfers">
          <StockTransfersReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/lifecycle"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockLifecycle">
          <ProductLifecycleReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockDashboard">
          <StockDashboardPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports"
      element={(
        <ProtectedRoute requiredRole="MANAGER">
          <ReportsHubPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/dashboard"
      element={(
        <ProtectedRoute module="financeDashboard">
          <FinanceDashboardPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/incomes"
      element={(
        <ProtectedRoute module="financeIncomes">
          <FinanceIncomesPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/debts"
      element={(
        <ProtectedRoute module="financeDebts">
          <FinanceDebtsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/expenses"
      element={(
        <ProtectedRoute module="financeExpenses">
          <FinanceExpensesPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/accounts"
      element={(
        <ProtectedRoute module="financeAccounts">
          <FinanceAccountsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/transfers"
      element={(
        <ProtectedRoute module="financeTransfers">
          <FinanceTransfersPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/reports"
      element={(
        <ProtectedRoute module="financeReports">
          <FinanceReportsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/audit"
      element={(
        <ProtectedRoute module="financeAudit">
          <FinanceAuditPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/categories"
      element={(
        <ProtectedRoute module="financeCategories">
          <FinanceCategoriesPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/sync"
      element={(
        <ProtectedRoute module="financeSync">
          <FinanceSyncPage />
        </ProtectedRoute>
      )}
    />
    <Route path="finance" element={<Navigate to="/finance/dashboard" replace />} />
    <Route
      path="cash-registers/list"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="registersList">
          <CashRegistersListPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="cash-registers/z-reports"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="registersZReports">
          <ZReportsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="cash-registers/transfer"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="registersTransfer">
          <CashRegisterTransferPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="cash-registers/config"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="registersConfig">
          <CashRegisterConfigPage />
        </ProtectedRoute>
      )}
    />
    <Route path="cash-registers" element={<Navigate to="/cash-registers/list" replace />} />
    <Route path="restaurant/hall" element={<Navigate to="/rst/admin/dashboard" replace />} />
    <Route path="restaurant/floor" element={<Navigate to="/rst/admin/dashboard" replace />} />
    <Route path="restaurant/kitchen" element={<Navigate to="/rst/kitchen" replace />} />
    <Route path="restaurant/booking" element={<Navigate to="/rst/admin/booking" replace />} />
    <Route path="restaurant/delivery" element={<Navigate to="/rst/admin/delivery" replace />} />
    <Route path="restaurant" element={<Navigate to="/rst/admin/dashboard" replace />} />
    <Route
      path="billing"
      element={(
        <ProtectedRoute requiredRole="ADMIN">
          <TenantBillingPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="stores"
      element={(
        <ProtectedRoute requiredRole="ADMIN" module="stores">
          <StoresPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="users/list"
      element={(
        <ProtectedRoute requiredRole="ADMIN" module="usersList">
          <UsersPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="users/printer-settings"
      element={(
        <ProtectedRoute requiredRole="ADMIN" module="usersPrinterSettings">
          <UsersPrinterSettingsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="users/branding-settings"
      element={(
        <ProtectedRoute requiredRole="ADMIN" module="usersBrandingSettings">
          <UsersBrandingSettingsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="users/barcode-print"
      element={(
        <ProtectedRoute module="usersBarcodePrint">
          <UsersBarcodePrintPage />
        </ProtectedRoute>
      )}
    />
    <Route path="users" element={<Navigate to="/users/list" replace />} />
    <Route path="handbook" element={<HandbookPage scope="admin" />} />
    <Route path="handbook/:moduleId" element={<HandbookPage scope="admin" />} />
    <Route path="support" element={<SupportPage />} />
  </Route>
);

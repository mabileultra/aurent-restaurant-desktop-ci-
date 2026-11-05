import { lazy } from 'react';
import { Route } from 'react-router-dom';

const FinanceDashboardPage = lazy(() => import('../../features/finance/pages/FinanceDashboardPage'));
const FinanceAccountsPage = lazy(() => import('../../features/finance/pages/FinanceAccountsPage'));
const FinanceIncomesPage = lazy(() => import('../../features/finance/pages/FinanceIncomesPage'));
const FinanceExpensesPage = lazy(() => import('../../features/finance/pages/FinanceExpensesPage'));
const FinanceReportsPage = lazy(() => import('../../features/finance/pages/FinanceReportsPage'));
const FinanceCategoriesPage = lazy(() => import('../../features/finance/pages/FinanceCategoriesPage'));
const FinanceDebtsPage = lazy(() => import('../../features/finance/pages/FinanceDebtsPage'));
const FinanceTransfersPage = lazy(() => import('../../features/finance/pages/FinanceTransfersPage'));
const FinanceAuditPage = lazy(() => import('../../features/finance/pages/FinanceAuditPage'));
const FinanceSyncPage = lazy(() => import('../../features/finance/pages/FinanceSyncPage'));

const CashRegistersListPage = lazy(() => import('../../features/cash-registers/pages/CashRegistersListPage'));
const ZReportsPage = lazy(() => import('../../features/cash-registers/pages/ZReportsPage'));
const CashRegisterTransferPage = lazy(() => import('../../features/cash-registers/pages/CashRegisterTransferPage'));
const CashRegisterConfigPage = lazy(() => import('../../features/cash-registers/pages/CashRegisterConfigPage'));

const StoresPage = lazy(() => import('../../features/tenant/pages/StoresPage'));
const UsersPage = lazy(() => import('../../features/tenant/pages/UsersPage'));
const UsersPrinterSettingsPage = lazy(() => import('../../features/tenant/pages/UsersPrinterSettingsPage'));
const UsersBrandingSettingsPage = lazy(() => import('../../features/tenant/pages/UsersBrandingSettingsPage'));
const UsersBarcodePrintPage = lazy(() => import('../../features/tenant/pages/UsersBarcodePrintPage'));

const TenantBillingPage = lazy(() => import('../../features/billing/pages/TenantBillingPage'));

/** Back-office routes that used to live on aurent for pharmacy. */
export function pharmacyOfficeRoutes() {
  return (
    <>
      <Route path="/finance/dashboard" element={<FinanceDashboardPage />} />
      <Route path="/finance/accounts" element={<FinanceAccountsPage />} />
      <Route path="/finance/incomes" element={<FinanceIncomesPage />} />
      <Route path="/finance/expenses" element={<FinanceExpensesPage />} />
      <Route path="/finance/reports" element={<FinanceReportsPage />} />
      <Route path="/finance/categories" element={<FinanceCategoriesPage />} />
      <Route path="/finance/debts" element={<FinanceDebtsPage />} />
      <Route path="/finance/transfers" element={<FinanceTransfersPage />} />
      <Route path="/finance/audit" element={<FinanceAuditPage />} />
      <Route path="/finance/sync" element={<FinanceSyncPage />} />
      <Route path="/finance" element={<FinanceDashboardPage />} />

      <Route path="/cash-registers/list" element={<CashRegistersListPage />} />
      <Route path="/cash-registers/z-reports" element={<ZReportsPage />} />
      <Route path="/cash-registers/transfer" element={<CashRegisterTransferPage />} />
      <Route path="/cash-registers/config" element={<CashRegisterConfigPage />} />
      <Route path="/cash-registers" element={<CashRegistersListPage />} />

      <Route path="/stores" element={<StoresPage />} />
      <Route path="/users/list" element={<UsersPage />} />
      <Route path="/users/printer-settings" element={<UsersPrinterSettingsPage />} />
      <Route path="/users/branding-settings" element={<UsersBrandingSettingsPage />} />
      <Route path="/users/barcode-print" element={<UsersBarcodePrintPage />} />
      <Route path="/users" element={<UsersPage />} />

      <Route path="/billing" element={<TenantBillingPage />} />
    </>
  );
}

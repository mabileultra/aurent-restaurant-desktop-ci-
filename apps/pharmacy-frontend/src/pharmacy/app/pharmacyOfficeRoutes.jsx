import { lazy } from 'react';
import { renderGuardedRoutes } from './PharmacyRouteGuard';
import { BILLING_ALLOWED_ROLES } from './pharmacyRouteAccess';

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

export const OFFICE_ROUTES = [
  { path: '/finance/dashboard', module: 'financeDashboard', Component: FinanceDashboardPage },
  { path: '/finance/accounts', module: 'financeAccounts', Component: FinanceAccountsPage },
  { path: '/finance/incomes', module: 'financeIncomes', Component: FinanceIncomesPage },
  { path: '/finance/expenses', module: 'financeExpenses', Component: FinanceExpensesPage },
  { path: '/finance/reports', module: 'financeReports', Component: FinanceReportsPage },
  { path: '/finance/categories', module: 'financeCategories', Component: FinanceCategoriesPage },
  { path: '/finance/debts', module: 'financeDebts', Component: FinanceDebtsPage },
  { path: '/finance/transfers', module: 'financeTransfers', Component: FinanceTransfersPage },
  { path: '/finance/audit', module: 'financeAudit', Component: FinanceAuditPage },
  { path: '/finance/sync', module: 'financeSync', Component: FinanceSyncPage },
  { path: '/finance', module: 'financeDashboard', Component: FinanceDashboardPage },
  { path: '/cash-registers/list', module: 'registersList', Component: CashRegistersListPage },
  { path: '/cash-registers/z-reports', module: 'registersZReports', Component: ZReportsPage },
  { path: '/cash-registers/transfer', module: 'registersTransfer', Component: CashRegisterTransferPage },
  { path: '/cash-registers/config', module: 'registersConfig', Component: CashRegisterConfigPage },
  { path: '/cash-registers', module: 'registersList', Component: CashRegistersListPage },
  { path: '/stores', module: 'stores', Component: StoresPage },
  { path: '/users/list', module: 'usersList', Component: UsersPage },
  { path: '/users/printer-settings', module: 'usersPrinterSettings', Component: UsersPrinterSettingsPage },
  { path: '/users/branding-settings', module: 'usersBrandingSettings', Component: UsersBrandingSettingsPage },
  { path: '/users/barcode-print', module: 'usersBarcodePrint', Component: UsersBarcodePrintPage },
  { path: '/users', module: 'usersList', Component: UsersPage },
  { path: '/billing', roles: BILLING_ALLOWED_ROLES, Component: TenantBillingPage },
];

/** Back-office routes that used to live on aurent for pharmacy. */
export function pharmacyOfficeRoutes() {
  return <>{renderGuardedRoutes(OFFICE_ROUTES)}</>;
}

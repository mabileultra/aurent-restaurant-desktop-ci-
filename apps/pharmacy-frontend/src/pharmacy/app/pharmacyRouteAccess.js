import {
  PHARM_DASHBOARD_PATH,
  PHARM_POS_PATH,
  PHARM_RETURNS_PATH,
  PHARM_SALES_PATH,
  PHARM_STOCK_PATHS,
} from './pharmacyPaths';

export const BILLING_ALLOWED_ROLES = ['ADMIN', 'ACCOUNTANT'];

export const PHARMACY_REPORT_MODULES = [
  'reportsSalesDaily',
  'reportsSalesByProducts',
  'reportsSalesByStores',
  'reportsCashierPerformance',
  'reportsReturns',
  'reportsStockBalances',
  'reportsStockLow',
  'reportsStockReceipts',
  'reportsStockInventories',
  'reportsStockTransfers',
  'reportsPriceRegistry',
];

const HOME_CANDIDATES = [
  { to: PHARM_DASHBOARD_PATH, module: 'dashboard' },
  { to: '/finance/dashboard', module: 'financeDashboard' },
  { to: '/finance/incomes', module: 'financeIncomes' },
  { to: '/finance/debts', module: 'financeDebts' },
  { to: '/finance/expenses', module: 'financeExpenses' },
  { to: '/finance/accounts', module: 'financeAccounts' },
  { to: '/finance/transfers', module: 'financeTransfers' },
  { to: '/finance/reports', module: 'financeReports' },
  { to: '/finance/audit', module: 'financeAudit' },
  { to: '/finance/categories', module: 'financeCategories' },
  { to: '/finance/sync', module: 'financeSync' },
  { to: PHARM_STOCK_PATHS.products, module: 'stockProducts' },
  { to: PHARM_STOCK_PATHS.receipts, module: 'stockReceipts' },
  { to: '/stock/inventories/new', module: 'stockInventories' },
  { to: '/stock/transfers/new', module: 'stockTransfers' },
  { to: '/stock/suppliers', module: 'stockSuppliers' },
  { to: PHARM_SALES_PATH, anyModules: ['reportsSales', 'reportsSalesDaily'] },
  { to: PHARM_RETURNS_PATH, module: 'reportsReturns' },
  { to: '/cash-registers/list', module: 'registersList' },
  { to: '/cash-registers/z-reports', module: 'registersZReports' },
  { to: '/cash-registers/transfer', module: 'registersTransfer' },
  { to: '/cash-registers/config', module: 'registersConfig' },
  { to: '/reports', anyModules: PHARMACY_REPORT_MODULES },
  { to: '/users/list', module: 'usersList' },
  { to: '/users/printer-settings', module: 'usersPrinterSettings' },
  { to: '/users/branding-settings', module: 'usersBrandingSettings' },
  { to: '/users/barcode-print', module: 'usersBarcodePrint' },
  { to: '/stores', module: 'stores' },
  { to: '/assistant', module: 'aiAssistant' },
  { to: '/billing', roles: BILLING_ALLOWED_ROLES },
];

export function canAccessBilling(role) {
  return BILLING_ALLOWED_ROLES.includes(role);
}

export function isPharmacyRouteAllowed({
  user,
  hasModule,
  hasAnyModule,
  module,
  anyModules,
  roles,
}) {
  if (!user?.role) return false;
  if (Array.isArray(roles) && !roles.includes(user.role)) {
    return false;
  }
  if (module && !hasModule(module)) {
    return false;
  }
  if (Array.isArray(anyModules) && anyModules.length > 0) {
    const allowedAny = hasAnyModule
      ? hasAnyModule(anyModules)
      : anyModules.some((id) => hasModule(id));
    if (!allowedAny) return false;
  }
  return true;
}

export function resolvePharmacyHomePath(user, hasModule) {
  const role = user?.role;
  if (!role) return '/login';
  if (role === 'CASHIER') return PHARM_POS_PATH;

  const check = (item) => isPharmacyRouteAllowed({
    user,
    hasModule,
    module: item.module,
    anyModules: item.anyModules,
    roles: item.roles,
  });

  const match = HOME_CANDIDATES.find(check);
  if (match) return match.to;
  if (hasModule('cashierPos')) return PHARM_POS_PATH;
  return '/handbook';
}


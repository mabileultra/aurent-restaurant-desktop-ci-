import {
  LayoutDashboard,
  Package,
  Plus,
  BarChart2,
  Calculator,
  Store,
  UserCog,
  Receipt,
  RotateCcw,
  AlertTriangle,
  ArrowLeftRight,
  ArrowRightLeft,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  List,
  FileText,
  Printer,
  Barcode,
  Users,
  Building2,
  Tags,
  SlidersHorizontal,
  Wallet,
  ShoppingCart,
  LogOut,
  Home,
  Bot,
  BookOpen,
  Headphones,
} from 'lucide-react';
import {
  PHARM_DASHBOARD_PATH,
  PHARM_POS_PATH,
  PHARM_RETURNS_PATH,
  PHARM_SALES_PATH,
  PHARM_STOCK_PATHS,
} from './pharmacyPaths';

export const PHARM_ICONS = {
  LayoutDashboard,
  Package,
  Home,
  Calculator,
  Users,
  BarChart2,
  ShoppingCart,
  LogOut,
  Bot,
  BookOpen,
  Headphones,
};

export const PHARM_ASSISTANT_ITEM = {
  to: '/assistant',
  key: 'aiAssistant',
  icon: Bot,
  moduleId: 'aiAssistant',
};

export const PHARM_HANDBOOK_ITEM = {
  to: '/handbook/dashboard',
  key: 'handbook',
  icon: BookOpen,
};

export const PHARM_SUPPORT_ITEM = {
  to: '/support',
  key: 'support',
  icon: Headphones,
};

/** Warehouse: catalog + receipts + inter-branch transfer + suppliers. */
export const PHARM_STOCK_CHILDREN = [
  { to: PHARM_STOCK_PATHS.products, key: 'stockPharmacyProducts', icon: Package, moduleId: 'stockProducts' },
  { to: PHARM_STOCK_PATHS.receipts, key: 'stockPharmacyReceipts', icon: Plus, moduleId: 'stockReceipts' },
  { to: '/stock/inventories/new', key: 'stockInventories', icon: ClipboardList, moduleId: 'stockInventories' },
  { to: '/stock/transfers/new', key: 'stockTransfers', icon: ArrowRightLeft, moduleId: 'stockTransfers' },
  { to: '/stock/suppliers', key: 'stockSuppliers', icon: Building2, moduleId: 'stockSuppliers' },
];

export const PHARM_SALES_CHILDREN = [
  { to: PHARM_SALES_PATH, key: 'sales', icon: Receipt },
  { to: PHARM_RETURNS_PATH, key: 'returns', icon: RotateCcw },
];

/** Pharmacy-facing reports only (no grocery analytics / sync / dead / movements). */
export const PHARM_REPORT_SALES_CHILDREN = [
  { to: '/reports/sales/daily', key: 'reportsSalesDaily', icon: Calculator, moduleId: 'reportsSalesDaily' },
  { to: '/reports/sales/by-products', key: 'reportsSalesByProducts', icon: Package, moduleId: 'reportsSalesByProducts' },
  { to: '/reports/sales/by-stores', key: 'reportsSalesByStores', icon: Store, moduleId: 'reportsSalesByStores' },
  { to: '/reports/sales/cashiers', key: 'reportsCashierPerformance', icon: UserCog, moduleId: 'reportsCashierPerformance' },
  { to: '/reports/returns', key: 'reportsReturns', icon: RotateCcw, moduleId: 'reportsReturns' },
];

export const PHARM_REPORT_STOCK_CHILDREN = [
  { to: '/reports/stock/balances', key: 'reportsStockBalances', icon: Package, moduleId: 'reportsStockBalances' },
  { to: '/reports/stock/low', key: 'reportsStockLow', icon: AlertTriangle, moduleId: 'reportsStockLow' },
  { to: '/reports/stock/receipts', key: 'reportsStockReceipts', icon: TrendingUp, moduleId: 'reportsStockReceipts' },
  { to: '/reports/stock/inventories', key: 'reportsStockInventories', icon: ClipboardList, moduleId: 'reportsStockInventories' },
  { to: '/reports/stock/transfers', key: 'reportsStockTransfers', icon: TrendingDown, moduleId: 'reportsStockTransfers' },
  { to: '/reports/stock/price-registry', key: 'reportsPriceRegistry', icon: Tags, moduleId: 'reportsPriceRegistry' },
];

export const PHARM_FINANCE_CHILDREN = [
  { to: '/finance/dashboard', key: 'financeDashboard', icon: LayoutDashboard, moduleId: 'financeDashboard' },
  { to: '/finance/incomes', key: 'financeIncomes', icon: TrendingUp, moduleId: 'financeIncomes' },
  { to: '/finance/debts', key: 'financeDebts', icon: Users, moduleId: 'financeDebts' },
  { to: '/finance/expenses', key: 'financeExpenses', icon: TrendingDown, moduleId: 'financeExpenses' },
  { to: '/finance/accounts', key: 'financeAccounts', icon: Building2, moduleId: 'financeAccounts' },
  { to: '/finance/transfers', key: 'financeTransfers', icon: ArrowLeftRight, moduleId: 'financeTransfers' },
  { to: '/finance/reports', key: 'financeReports', icon: BarChart2, moduleId: 'financeReports' },
  { to: '/finance/audit', key: 'financeAudit', icon: FileText, moduleId: 'financeAudit' },
  { to: '/finance/categories', key: 'financeCategories', icon: Tags, moduleId: 'financeCategories' },
  { to: '/finance/sync', key: 'financeSync', icon: RotateCcw, moduleId: 'financeSync' },
];

export const PHARM_REGISTER_CHILDREN = [
  { to: '/cash-registers/list', key: 'registersList', icon: List, moduleId: 'registersList' },
  { to: '/cash-registers/z-reports', key: 'registersZReports', icon: FileText, moduleId: 'registersZReports' },
  { to: '/cash-registers/transfer', key: 'registersTransfer', icon: ArrowLeftRight, moduleId: 'registersTransfer' },
  { to: '/cash-registers/config', key: 'registersConfig', icon: SlidersHorizontal, moduleId: 'registersConfig' },
];

export const PHARM_USER_CHILDREN = [
  { to: '/users/list', key: 'usersList', icon: List, moduleId: 'usersList' },
  { to: '/users/printer-settings', key: 'usersPrinterSettings', icon: Printer, moduleId: 'usersPrinterSettings' },
  { to: '/users/branding-settings', key: 'usersBrandingSettings', icon: UserCog, moduleId: 'usersBrandingSettings' },
  { to: '/users/barcode-print', key: 'usersBarcodePrint', icon: Barcode, moduleId: 'usersBarcodePrint' },
];

export const PHARM_REST_NAV = [
  { to: '/billing', key: 'billing', icon: Wallet },
  { to: '/stores', key: 'stores', icon: Store, moduleId: 'stores' },
];

export const PHARM_DASHBOARD_ITEM = {
  to: PHARM_DASHBOARD_PATH,
  key: 'dashboard',
  icon: LayoutDashboard,
  moduleId: 'dashboard',
};

export const PHARM_POS_ITEM = {
  to: PHARM_POS_PATH,
  key: 'cashier',
  icon: ShoppingCart,
  moduleId: 'cashierPos',
};

export const PHARM_REPORT_HUB = { to: '/reports', key: 'reportsHub', icon: BarChart2 };

export const pathInList = (pathname, routes) => routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
export const pathStarts = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`);

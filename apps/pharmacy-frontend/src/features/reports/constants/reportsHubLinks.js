import {
  Calculator,
  Store,
  Package,
  UserCog,
  RotateCcw,
  AlertTriangle,
  ClipboardList,
  Truck,
  TrendingUp,
  Tags,
} from 'lucide-react';

/** Slim pharmacy reports hub — keep in sync with PHARM_REPORT_*_CHILDREN. */
export const REPORTS_HUB_SALES_LINKS = [
  { to: '/reports/sales/daily', key: 'reportsSalesDaily', icon: Calculator, moduleId: 'reportsSalesDaily' },
  { to: '/reports/sales/by-products', key: 'reportsSalesByProducts', icon: Package, moduleId: 'reportsSalesByProducts' },
  { to: '/reports/sales/by-stores', key: 'reportsSalesByStores', icon: Store, moduleId: 'reportsSalesByStores' },
  { to: '/reports/sales/cashiers', key: 'reportsCashierPerformance', icon: UserCog, moduleId: 'reportsCashierPerformance' },
  { to: '/reports/returns', key: 'reportsReturns', icon: RotateCcw, moduleId: 'reportsReturns' },
];

export const REPORTS_HUB_STOCK_LINKS = [
  { to: '/reports/stock/balances', key: 'reportsStockBalances', icon: Package, moduleId: 'reportsStockBalances' },
  { to: '/reports/stock/low', key: 'reportsStockLow', icon: AlertTriangle, moduleId: 'reportsStockLow' },
  { to: '/reports/stock/receipts', key: 'reportsStockReceipts', icon: TrendingUp, moduleId: 'reportsStockReceipts' },
  { to: '/reports/stock/inventories', key: 'reportsStockInventories', icon: ClipboardList, moduleId: 'reportsStockInventories' },
  { to: '/reports/stock/transfers', key: 'reportsStockTransfers', icon: Truck, moduleId: 'reportsStockTransfers' },
  { to: '/reports/stock/price-registry', key: 'reportsPriceRegistry', icon: Tags, moduleId: 'reportsPriceRegistry' },
];

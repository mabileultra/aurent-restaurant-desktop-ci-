import {
  PHARM_DASHBOARD_PATH,
  PHARM_POS_PATH,
  PHARM_RETURNS_PATH,
  PHARM_SALES_PATH,
  PHARM_STOCK_PATHS,
} from './pharmacyPaths';

/** Admin chrome primary nav (pharmacy SPA only). */
export const PHARMACY_ADMIN_NAV = [
  { to: PHARM_DASHBOARD_PATH, labelKey: 'nav.dashboard', fallback: 'Дашборд' },
  { to: PHARM_POS_PATH, labelKey: 'nav.cashier', fallback: 'Касса' },
  { to: PHARM_STOCK_PATHS.products, labelKey: 'nav.stockPharmacyProducts', fallback: 'Товары' },
  { to: PHARM_STOCK_PATHS.receipts, labelKey: 'nav.stockPharmacyReceipts', fallback: 'Приход' },
  { to: PHARM_STOCK_PATHS.aslMarks, labelKey: 'nav.stockPharmacyAslMarks', fallback: 'ASL' },
  { to: PHARM_SALES_PATH, labelKey: 'nav.sales', fallback: 'Продажи' },
  { to: PHARM_RETURNS_PATH, labelKey: 'nav.returns', fallback: 'Возвраты' },
];

/** Canonical pharmacy UI paths on p-aurent.uz (own origin — no /pharm prefix). */

export const PHARM_HOME_PATH = '/';
export const PHARM_POS_PATH = '/pos';
export const PHARM_STOCK_PRODUCTS_PATH = '/stock/products';
export const PHARM_RETURNS_PATH = '/returns';
export const PHARM_SALES_PATH = '/sales';
export const PHARM_DASHBOARD_PATH = '/dashboard';

export const PHARM_STOCK_PATHS = {
  receipts: '/stock/receipts',
  receiptsNew: '/stock/receipts/new',
  receipt: (id) => `/stock/receipts/${id}`,
  receiptPick: (id) => `/stock/receipts/${id}/pick`,
  products: PHARM_STOCK_PRODUCTS_PATH,
};

export { isPharmacyBusinessType } from '@aurent/shared-tenant';

export function isPharmPosPath(pathname) {
  const p = String(pathname || '');
  return p === '/pos' || p.startsWith('/pos/')
    || p.startsWith('/pharm/pos')
    || p.startsWith('/cashier/pharmacy');
}

export function isPharmStockPath(pathname) {
  const p = String(pathname || '');
  return p.startsWith('/stock/') || p.startsWith('/pharm/stock/') || p.startsWith('/pharmacy/stock/');
}

/** Канонические пути аптечного UI (`/pharm/**`). */
export const PHARM_POS_PATH = '/pharm/pos';

export const PHARM_STOCK_PATHS = {
  receipts: '/pharm/stock/receipts',
  receiptsNew: '/pharm/stock/receipts/new',
  receipt: (id) => `/pharm/stock/receipts/${id}`,
  receiptPick: (id) => `/pharm/stock/receipts/${id}/pick`,
  products: '/pharm/stock/products',
};

export function isPharmacyBusinessType(code) {
  return String(code || '').trim().toUpperCase() === 'PHARMACY';
}

export function isPharmPosPath(pathname) {
  return String(pathname || '').startsWith(PHARM_POS_PATH)
    || String(pathname || '').startsWith('/cashier/pharmacy');
}

export function isPharmStockPath(pathname) {
  const p = String(pathname || '');
  return p.startsWith('/pharm/stock/') || p.startsWith('/pharmacy/stock/');
}

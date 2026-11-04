/** Canonical pharmacy UI paths on p-aurent.uz (no /pharm prefix — own origin). */

export const PHARM_HOME_PATH = '/';
export const PHARM_POS_PATH = '/pos';
export const PHARM_STOCK_PRODUCTS_PATH = '/stock/products';

export const PHARM_STOCK_PATHS = {
  receipts: '/stock/receipts',
  receiptsNew: '/stock/receipts/new',
  receipt: (id) => `/stock/receipts/${id}`,
  receiptPick: (id) => `/stock/receipts/${id}/pick`,
  products: PHARM_STOCK_PRODUCTS_PATH,
  aslMarks: '/stock/asl-marks',
  aslRequests: '/stock/asl-requests',
};

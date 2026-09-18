export const STOCK_PAGE_SIZE_DEFAULT = 50;
export const STOCK_PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

export const STOCK_PRODUCT_DEFAULT_FILTERS = {
  barcode: '',
  markedProduct: '',
};

export const canManageStock = (role) => role === 'ADMIN' || role === 'MANAGER';

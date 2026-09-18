export const PRODUCT_DEFAULT_FILTERS = {
  ikpuStatus: 'ALL',
  storeId: '',
  barcode: '',
  categoryId: '',
  soldIndividually: '',
  markedProduct: '',
  deletedScope: 'ACTIVE',
  attributes: {},
};

/** Только таблица товаров каталога — больше строк за запрос, без смены пагинации отчётов и др. */
export const PRODUCT_TABLE_PAGE_SIZE_DEFAULT = 50;
export const PRODUCT_TABLE_PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

export function buildAttributeFiltersParam(attributes = {}) {
  const entries = Object.entries(attributes).filter(([, value]) => value !== '' && value != null);
  if (!entries.length) return undefined;
  return JSON.stringify(Object.fromEntries(entries));
}

export const SUPPLIER_DEFAULT_FILTERS = {
  createdOn: '',
};

export function canManageCatalog(role) {
  return role === 'ADMIN' || role === 'MANAGER';
}

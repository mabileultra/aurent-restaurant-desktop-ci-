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

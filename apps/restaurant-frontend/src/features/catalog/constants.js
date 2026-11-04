export function canManageCatalog(role) {
  return role === 'ADMIN' || role === 'MANAGER';
}

export const SUPPLIER_DEFAULT_FILTERS = {
  createdOn: '',
};

export const PRODUCT_TABLE_PAGE_SIZE_DEFAULT = 50;
export const PRODUCT_TABLE_PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

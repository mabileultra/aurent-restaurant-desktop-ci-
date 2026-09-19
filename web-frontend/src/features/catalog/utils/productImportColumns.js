/**
 * Колонки предпросмотра импорта товаров (выбор видимости).
 */

export const PRODUCT_IMPORT_COLUMNS_STORAGE_KEY = 'productImport.visibleColumns.v1';

export const PRODUCT_IMPORT_COLUMN_DEFS = [
  { id: 'rowNum', labelKey: 'products.import.colRow', defaultOn: true, sticky: true },
  { id: 'tasnif', labelKey: 'products.import.colTasnif', defaultOn: true },
  { id: 'name', labelKey: 'products.import.colName', defaultOn: true },
  { id: 'barcode', labelKey: 'products.import.colBarcode', defaultOn: true },
  { id: 'ikpu', labelKey: 'products.import.colIkpu', defaultOn: true },
  { id: 'marking', labelKey: 'products.import.colMarking', defaultOn: true },
  { id: 'qty', labelKey: 'products.import.colQty', defaultOn: true },
  { id: 'unit', labelKey: 'products.import.colUnit', defaultOn: false },
  { id: 'saleType', labelKey: 'products.import.colSaleType', defaultOn: false },
  { id: 'vat', labelKey: 'products.import.colVat', defaultOn: false },
  { id: 'location', labelKey: 'products.import.colLocation', defaultOn: true },
  { id: 'filePrice', labelKey: 'products.import.colFilePrice', defaultOn: true },
  { id: 'importPrice', labelKey: 'products.import.colImportPrice', defaultOn: true },
  { id: 'category', labelKey: 'products.import.colCategory', defaultOn: true },
  { id: 'store', labelKey: 'products.import.colStore', defaultOn: true },
  { id: 'status', labelKey: 'products.import.colStatus', defaultOn: true },
];

export function defaultProductImportColumnVisibility() {
  return Object.fromEntries(PRODUCT_IMPORT_COLUMN_DEFS.map((c) => [c.id, c.defaultOn]));
}

export function loadProductImportColumnVisibility() {
  const defaults = defaultProductImportColumnVisibility();
  try {
    const raw = localStorage.getItem(PRODUCT_IMPORT_COLUMNS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function saveProductImportColumnVisibility(map) {
  try {
    localStorage.setItem(PRODUCT_IMPORT_COLUMNS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

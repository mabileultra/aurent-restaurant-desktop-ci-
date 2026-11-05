/** Колонки каталога кассы — видимость в localStorage. */

export const PHARMACY_CATALOG_COLUMN_DEFS = [
  { id: 'stock', labelKey: 'pharmacyCashier.colStock' },
  { id: 'cost', labelKey: 'pharmacyCashier.colCost' },
  { id: 'price', labelKey: 'pharmacyCashier.colPrice' },
  { id: 'unitPrice', labelKey: 'pharmacyCashier.colUnitPrice' },
  { id: 'expiry', labelKey: 'pharmacyCashier.colExpiryDays' },
  { id: 'shelf', labelKey: 'pharmacyCashier.colShelf' },
  { id: 'manufacturer', labelKey: 'pharmacyCashier.colManufacturer' },
  { id: 'country', labelKey: 'pharmacyCashier.colCountry' },
  { id: 'batch', labelKey: 'pharmacyCashier.colBatch' },
  { id: 'score', labelKey: 'pharmacyCashier.colScore' },
  { id: 'refPrice', labelKey: 'pharmacyCashier.colRefPrice' },
  { id: 'fiscal', labelKey: 'pharmacyCashier.colIkpu' },
];

const STORAGE_KEY = 'pharmacy-pos-catalog-cols-v1';

export function defaultCatalogColumnVisibility() {
  return Object.fromEntries(PHARMACY_CATALOG_COLUMN_DEFS.map((c) => [c.id, true]));
}

export function loadCatalogColumnVisibility() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCatalogColumnVisibility();
    const parsed = JSON.parse(raw);
    return { ...defaultCatalogColumnVisibility(), ...parsed };
  } catch {
    return defaultCatalogColumnVisibility();
  }
}

export function saveCatalogColumnVisibility(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

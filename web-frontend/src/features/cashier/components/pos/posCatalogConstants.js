export const POS_CATALOG_VIEW_MODE_KEY = 'pos-catalog-view-mode';
/** Страница каталога: с виртуализацией DOM не растёт — умеренный размер хватает. */
export const POS_PRODUCT_PAGE_SIZE = 60;
/** Аптека: меньше страница — серия/срок/FEFO не бьют по API. */
export const PHARMACY_POS_PRODUCT_PAGE_SIZE = 40;
/** Prefetch: только текущая страница; дальше — по скроллу (DOM windowed). */
export const POS_CATALOG_PREFETCH_PAGES = 1;
/** Аптека: только текущая страница, дальше — по скроллу. */
export const PHARMACY_CATALOG_PREFETCH_PAGES = 1;

export function posCatalogPageSize(catalogKind) {
  return catalogKind === 'pharmacy' ? PHARMACY_POS_PRODUCT_PAGE_SIZE : POS_PRODUCT_PAGE_SIZE;
}

export function posCatalogPrefetchPages(catalogKind) {
  return catalogKind === 'pharmacy' ? PHARMACY_CATALOG_PREFETCH_PAGES : POS_CATALOG_PREFETCH_PAGES;
}

export function readPosCatalogViewMode() {
  try {
    const v = localStorage.getItem(POS_CATALOG_VIEW_MODE_KEY);
    if (v === 'list' || v === 'grid') return v;
  } catch {
    /* ignore */
  }
  return 'grid';
}

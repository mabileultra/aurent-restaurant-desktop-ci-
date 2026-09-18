export const POS_CATALOG_VIEW_MODE_KEY = 'pos-catalog-view-mode';
/** Больше товаров за страницу — быстрее сетка кассы (продукт + аптека). */
export const POS_PRODUCT_PAGE_SIZE = 120;
/** Сколько страниц каталога держать заранее (включая уже показанную первую). */
export const POS_CATALOG_PREFETCH_PAGES = 3;

export function readPosCatalogViewMode() {
  try {
    const v = localStorage.getItem(POS_CATALOG_VIEW_MODE_KEY);
    if (v === 'list' || v === 'grid') return v;
  } catch {
    /* ignore */
  }
  return 'grid';
}

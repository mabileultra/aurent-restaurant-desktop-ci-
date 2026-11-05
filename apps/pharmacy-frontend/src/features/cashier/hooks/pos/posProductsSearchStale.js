/**
 * keepPreviousData: список товаров от прошлого запроса нельзя брать для Enter/клика,
 * пока идёт новый поиск (не путать с подгрузкой следующей страницы).
 */
export function isPosProductsSearchStale({
  searchActive = false,
  productsPlaceholder = false,
  productsFetching = false,
  productsLoadingMore = false,
} = {}) {
  if (!searchActive) return false;
  if (productsPlaceholder) return true;
  if (productsFetching && !productsLoadingMore) return true;
  return false;
}

/** Можно ли добавить товар из текущего списка (не через barcode API). */
export function canAddProductFromSearchList({ productsStale = false, products = [] } = {}) {
  if (productsStale) return false;
  return Array.isArray(products) && products.length > 0;
}

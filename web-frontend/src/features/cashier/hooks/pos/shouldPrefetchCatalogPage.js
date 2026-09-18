import { POS_CATALOG_PREFETCH_PAGES } from '../../components/pos/posCatalogConstants';

/** После первой страницы заранее тянем ещё несколько — не весь каталог. */
export function shouldPrefetchCatalogPage({
  enabled,
  pagesLoaded,
  hasNextPage,
  isFetchingNextPage,
  maxPrefetchPages = POS_CATALOG_PREFETCH_PAGES,
} = {}) {
  return Boolean(enabled)
    && pagesLoaded >= 1
    && pagesLoaded < maxPrefetchPages
    && Boolean(hasNextPage)
    && !isFetchingNextPage;
}

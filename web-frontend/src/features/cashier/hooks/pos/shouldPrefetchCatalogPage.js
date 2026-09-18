/** Первая страница уже на экране — заранее тянем только следующую. */
export function shouldPrefetchCatalogPage({
  enabled,
  pagesLoaded,
  hasNextPage,
  isFetchingNextPage,
} = {}) {
  return Boolean(enabled)
    && pagesLoaded === 1
    && Boolean(hasNextPage)
    && !isFetchingNextPage;
}

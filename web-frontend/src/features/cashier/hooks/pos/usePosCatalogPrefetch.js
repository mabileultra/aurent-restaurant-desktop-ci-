import { useEffect } from 'react';
import { shouldPrefetchCatalogPage } from './shouldPrefetchCatalogPage';

/**
 * Prefetch нескольких следующих страниц после первой успешной загрузки
 * (не прогоняет весь каталог).
 */
export function usePosCatalogPrefetch({
  enabled,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  pagesLoaded = 0,
}) {
  useEffect(() => {
    if (!shouldPrefetchCatalogPage({
      enabled,
      pagesLoaded,
      hasNextPage,
      isFetchingNextPage,
    })) return undefined;
    const timer = setTimeout(() => {
      fetchNextPage?.();
    }, 80);
    return () => clearTimeout(timer);
  }, [
    enabled,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    pagesLoaded,
  ]);
}

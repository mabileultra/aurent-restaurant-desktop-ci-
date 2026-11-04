import { useEffect } from 'react';
import { shouldPrefetchCatalogPage } from './shouldPrefetchCatalogPage';
import { POS_CATALOG_PREFETCH_PAGES } from '../../components/pos/posCatalogConstants';

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
  maxPrefetchPages = POS_CATALOG_PREFETCH_PAGES,
}) {
  useEffect(() => {
    if (!shouldPrefetchCatalogPage({
      enabled,
      pagesLoaded,
      hasNextPage,
      isFetchingNextPage,
      maxPrefetchPages,
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
    maxPrefetchPages,
  ]);
}

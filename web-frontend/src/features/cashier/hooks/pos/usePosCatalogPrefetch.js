import { useEffect, useRef } from 'react';

/**
 * Prefetch ровно следующей страницы после первой успешной загрузки
 * (не прогоняет весь каталог).
 */
export function usePosCatalogPrefetch({
  enabled,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  pagesLoaded = 0,
  queryKey = '',
}) {
  const doneForQueryRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    if (pagesLoaded !== 1 || !hasNextPage || isFetchingNextPage) return undefined;
    if (doneForQueryRef.current === queryKey) return undefined;
    doneForQueryRef.current = queryKey;
    const timer = setTimeout(() => {
      fetchNextPage?.();
    }, 120);
    return () => clearTimeout(timer);
  }, [
    enabled,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    pagesLoaded,
    queryKey,
  ]);
}

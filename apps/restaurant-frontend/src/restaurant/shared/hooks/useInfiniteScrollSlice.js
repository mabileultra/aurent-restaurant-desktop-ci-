import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Client-side infinite scroll: reveal items in pages as the sentinel enters the scroll root.
 */
export function useInfiniteScrollSlice(items, {
  pageSize = 20,
  resetKey,
  rootMargin = '120px',
  enabled = true,
} = {}) {
  const list = Array.isArray(items) ? items : [];
  const effectivePageSize = enabled ? pageSize : Math.max(list.length, 1);
  const [visibleCount, setVisibleCount] = useState(effectivePageSize);
  const rootRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setVisibleCount(effectivePageSize);
  }, [resetKey, effectivePageSize]);

  useEffect(() => {
    setVisibleCount((prev) => Math.min(Math.max(prev, effectivePageSize), Math.max(list.length, effectivePageSize)));
  }, [list.length, effectivePageSize]);

  const loadMore = useCallback(() => {
    if (!enabled) return;
    setVisibleCount((prev) => Math.min(prev + pageSize, list.length));
  }, [enabled, pageSize, list.length]);

  const hasMore = enabled && visibleCount < list.length;
  const visibleItems = enabled ? list.slice(0, visibleCount) : list;

  useEffect(() => {
    if (!enabled) return undefined;
    const root = rootRef.current;
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { root: root ?? null, rootMargin, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, hasMore, loadMore, rootMargin, visibleCount, resetKey]);

  return {
    visibleItems,
    hasMore,
    visibleCount,
    totalCount: list.length,
    rootRef,
    sentinelRef,
  };
}

import { useState } from 'react';

export const ANALYTICS_PAGE_SIZES = [10, 20, 50, 100];

export function usePagedRows(rows, initialSize = 10) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(initialSize);
  const list = rows ?? [];
  const pages = Math.max(1, Math.ceil(list.length / size) || 1);
  const safePage = Math.min(page, pages - 1);
  const offset = safePage * size;
  return {
    page: safePage,
    size,
    pageSizes: ANALYTICS_PAGE_SIZES,
    total: list.length,
    offset,
    rows: list.slice(offset, offset + size),
    setPage,
    setSize: (next) => {
      setSize(next);
      setPage(0);
    },
  };
}

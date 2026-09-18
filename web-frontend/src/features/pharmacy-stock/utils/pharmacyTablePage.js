import { useEffect, useMemo, useState } from 'react';

/** Только товарные таблицы аптеки — больше строк за запрос. */
export const PHARM_PAGE_SIZES = [20, 50, 100, 200];
export const PHARM_DEFAULT_PAGE_SIZE = 50;

export function slicePage(rows, page, pageSize) {
  const list = Array.isArray(rows) ? rows : [];
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const start = safePage * pageSize;
  return {
    rows: list.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
    startIndex: start,
  };
}

export function useClientTablePage(items, resetKey) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PHARM_DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  const sliced = useMemo(
    () => slicePage(items, page, pageSize),
    [items, page, pageSize],
  );

  useEffect(() => {
    if (sliced.page !== page) setPage(sliced.page);
  }, [sliced.page, page]);

  return {
    page: sliced.page,
    pageSize,
    rows: sliced.rows,
    total: sliced.total,
    totalPages: sliced.totalPages,
    startIndex: sliced.startIndex,
    setPage,
    setPageSize,
  };
}

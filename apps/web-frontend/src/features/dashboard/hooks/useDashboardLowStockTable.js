import { useMemo, useState } from 'react';

const DEFAULT_PAGE_SIZE = 14;
export const DASHBOARD_LOW_STOCK_PAGE_SIZES = [10, 14, 20];

export function useDashboardLowStockTable(lowStock) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const total = lowStock?.length ?? 0;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));

  const rows = useMemo(() => {
    if (!lowStock?.length) return [];
    const start = safePage * pageSize;
    return lowStock.slice(start, start + pageSize);
  }, [lowStock, safePage, pageSize]);

  const handlePageChange = (next) => {
    setPage(Math.max(0, Math.min(next, totalPages - 1)));
  };

  const handlePageSizeChange = (nextSize) => {
    setPageSize(nextSize);
    setPage(0);
  };

  return {
    rows,
    page: safePage,
    pageSize,
    total,
    totalPages,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
  };
}

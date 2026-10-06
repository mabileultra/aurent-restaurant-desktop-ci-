import { useEffect, useMemo, useState } from 'react';

/** Клиентская пагинация списка для таблиц аналитики. */
export function useAnalyticsTablePage(rows, pageSizeDefault = 20) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(pageSizeDefault);
  const total = rows?.length || 0;

  useEffect(() => {
    setPage(0);
  }, [rows, pageSize]);

  const pageRows = useMemo(() => {
    const start = page * pageSize;
    return (rows || []).slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    pageRows,
  };
}

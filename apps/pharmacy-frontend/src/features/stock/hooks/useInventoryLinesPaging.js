import { useEffect, useMemo, useRef, useState } from 'react';

export function useInventoryLinesPaging(items, { resetKey, stickToEndKey, initialPageSize = 10 } = {}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const lastStick = useRef(stickToEndKey);

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  const total = items?.length ?? 0;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));

  useEffect(() => {
    if (stickToEndKey && stickToEndKey !== lastStick.current) {
      setPage(Math.max(0, Math.ceil(total / pageSize) - 1));
    }
    lastStick.current = stickToEndKey;
  }, [stickToEndKey, total, pageSize]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const rows = useMemo(() => {
    const start = safePage * pageSize;
    return (items ?? []).slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    rows,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
  };
}

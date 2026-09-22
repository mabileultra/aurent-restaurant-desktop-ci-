import { useEffect, useMemo, useState } from 'react';

export const DOC_LINES_PAGE_SIZE_DEFAULT = 10;
export const DOC_LINES_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

/** Client-side pagination for document line tables. */
export function useDocumentLinesPage(lines = [], { resetKey } = {}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DOC_LINES_PAGE_SIZE_DEFAULT);

  const total = lines.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const start = page * pageSize;
  const pageRows = useMemo(
    () => lines.slice(start, start + pageSize),
    [lines, start, pageSize],
  );

  const goToLastPage = (nextTotal = total) => {
    const last = Math.max(0, Math.ceil(nextTotal / pageSize) - 1);
    setPage(last);
  };

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageSizeOptions: DOC_LINES_PAGE_SIZE_OPTIONS,
    total,
    totalPages,
    start,
    pageRows,
    goToLastPage,
  };
}

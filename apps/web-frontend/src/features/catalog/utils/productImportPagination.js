export const PRODUCT_IMPORT_PAGE_SIZES = [10, 20];
export const PRODUCT_IMPORT_DEFAULT_PAGE_SIZE = 10;

export function clampImportPage(page, totalPages) {
  const max = Math.max(1, totalPages);
  const n = Number(page) || 1;
  return Math.min(Math.max(1, n), max);
}

export function importTotalPages(totalRows, pageSize) {
  const size = Math.max(1, Number(pageSize) || PRODUCT_IMPORT_DEFAULT_PAGE_SIZE);
  const total = Math.max(0, Number(totalRows) || 0);
  return Math.max(1, Math.ceil(total / size));
}

export function sliceImportPage(rows, page, pageSize) {
  const list = Array.isArray(rows) ? rows : [];
  const size = Math.max(1, Number(pageSize) || PRODUCT_IMPORT_DEFAULT_PAGE_SIZE);
  const totalPages = importTotalPages(list.length, size);
  const safePage = clampImportPage(page, totalPages);
  const start = (safePage - 1) * size;
  return {
    pageRows: list.slice(start, start + size),
    page: safePage,
    totalPages,
    from: list.length === 0 ? 0 : start + 1,
    to: Math.min(list.length, start + size),
    total: list.length,
  };
}

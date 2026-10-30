import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseSelect } from '../ui';
import '../../styles/shared/table-pagination.css';

export const TABLE_PAGE_SIZE_OPTIONS = [10, 14, 20];
export const TABLE_PAGE_SIZE_OPTIONS_EXTENDED = [10, 14, 20, 50];

function buildPageButtons(totalPages, page) {
  if (totalPages <= 0) return [0];
  if (totalPages <= 1) return [0];
  const maxBtns = 5;
  if (totalPages <= maxBtns) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  let start = Math.max(0, page - 2);
  let end = Math.min(totalPages, start + maxBtns);
  start = Math.max(0, end - maxBtns);
  return Array.from({ length: end - start }, (_, i) => start + i);
}

export default function TablePagination({
  page,
  displayPage,
  pageSize,
  total,
  totalPages: totalPagesProp,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = TABLE_PAGE_SIZE_OPTIONS,
  className = '',
}) {
  const { t } = useTranslation();

  const totalPages = totalPagesProp ?? (pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1);
  const activeDisplayPage = typeof displayPage === 'number' ? displayPage : page;
  const from = total === 0 ? 0 : activeDisplayPage * pageSize + 1;
  const to = Math.min((activeDisplayPage + 1) * pageSize, total);

  const pageButtons = useMemo(() => buildPageButtons(totalPages, page), [totalPages, page]);
  const showEllipsisBefore = totalPages > 5 && pageButtons.length > 0 && pageButtons[0] > 0;
  const showEllipsisAfter =
    totalPages > 5 && pageButtons.length > 0 && pageButtons[pageButtons.length - 1] < totalPages - 1;

  const displayButtons = totalPages <= 1 ? [0] : pageButtons;

  return (
    <div
      className={`table-pagination flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between ${className}`.trim()}
    >
      <div className="table-pagination__meta">
        <span className="table-pagination__range">
          {t('products.recordsRange', { from, to, total })}
        </span>
        {onPageSizeChange ? (
          <div className="table-pagination__page-size">
            <span className="table-pagination__page-size-label">
              {t('cashRegisters.pageSizePrefix')}
            </span>
            <BaseSelect
              size="sm"
              value={pageSize}
              onChange={(e) => {
                const nextSize = Number(e.target.value);
                if (nextSize !== pageSize) {
                  onPageChange(0);
                  onPageSizeChange(nextSize);
                }
              }}
              options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
            />
          </div>
        ) : null}
      </div>

      <div className="table-pagination__nav">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="table-pagination__nav-btn"
        >
          {t('common.prev')}
        </button>
        {showEllipsisBefore ? (
          <>
            <button
              type="button"
              onClick={() => onPageChange(0)}
              className="table-pagination__page-btn"
            >
              1
            </button>
            <span className="table-pagination__ellipsis">…</span>
          </>
        ) : null}
        {displayButtons.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => totalPages > 1 && onPageChange(i)}
            disabled={totalPages <= 1 && i !== page}
            className={`table-pagination__page-btn ${page === i ? 'table-pagination__page-btn--active' : ''}`.trim()}
          >
            {i + 1}
          </button>
        ))}
        {showEllipsisAfter ? (
          <>
            <span className="table-pagination__ellipsis">…</span>
            <button
              type="button"
              onClick={() => onPageChange(totalPages - 1)}
              className="table-pagination__page-btn"
            >
              {totalPages}
            </button>
          </>
        ) : null}
        <button
          type="button"
          disabled={page >= totalPages - 1 || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
          className="table-pagination__nav-btn"
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}

import { BaseSelect } from '../../../components/ui';

export default function CashRegistersListFooter({
  t,
  fromN,
  toN,
  total,
  page,
  pageSize,
  pageSizeOptions,
  pageButtons,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-sm text-ink-muted lg:flex-row lg:items-center lg:justify-between">
      <span className="ui-tabular">{t('products.recordsRange', { from: fromN, to: toN, total })}</span>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-muted">{t('cashRegisters.pageSizePrefix')}</span>
        <BaseSelect
          size="sm"
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(0);
          }}
          options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
        />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1 sm:flex-1">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          className="ui-pagination-btn"
        >
          {t('common.prev')}
        </button>
        {(totalPages <= 1 ? [0] : pageButtons).map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => totalPages > 1 && onPageChange(i)}
            disabled={totalPages <= 1}
            className={page === i ? 'ui-pagination-btn ui-pagination-btn-active' : 'ui-pagination-btn'}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages - 1 || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
          className="ui-pagination-btn"
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}

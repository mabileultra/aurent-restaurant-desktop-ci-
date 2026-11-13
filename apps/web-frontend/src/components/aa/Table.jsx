import React from 'react';
import clsx from 'clsx';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';

/**
 * Aurent Admin — Table jadval komponenti.
 * aa-components.css dagi .aa-table-wrap, .aa-table, .aa-pager sinflaridan foydalanadi.
 */
export default function Table({
  columns = [],
  rows = [],
  rowKey = 'id',
  sort,
  onSort,
  selectedKey,
  onRowClick,
  loading = false,
  empty,
  pagination,
  className,
  ...props
}) {
  const getRowId = (row, idx) => {
    if (typeof rowKey === 'function') return rowKey(row);
    return row[rowKey] ?? idx;
  };

  const renderSortIcon = (colKey) => {
    if (sort?.key !== colKey) {
      return <ArrowUpDown className="aa-icon opacity-50" aria-hidden="true" />;
    }
    return sort.order === 'asc' ? (
      <ArrowUp className="aa-icon" aria-hidden="true" />
    ) : (
      <ArrowDown className="aa-icon" aria-hidden="true" />
    );
  };

  return (
    <div className={clsx('aa-table-wrap', className)} {...props}>
      <div className="aa-table-scroll">
        <table className="aa-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                const ariaSort = col.sortable
                  ? isSorted
                    ? sort.order === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                  : undefined;

                return (
                  <th
                    key={col.key}
                    aria-sort={ariaSort}
                    className={clsx(col.align === 'right' && 'aa-col-num', col.className)}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort?.(col.key)}
                        className="aa-th-sort"
                      >
                        <span>{col.title}</span>
                        {renderSortIcon(col.key)}
                      </button>
                    ) : (
                      col.title
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skel-row-${rIdx}`}>
                  {columns.map((col, cIdx) => (
                    <td key={`skel-col-${cIdx}`} className={col.align === 'right' ? 'aa-col-num' : undefined}>
                      <Skeleton variant="text" width={col.align === 'right' ? '50%' : '75%'} />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {empty || <EmptyState title="Ma’lumot topilmadi" text="Hozircha hech qanday ma’lumot mavjud emas." />}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const id = getRowId(row, idx);
                const isSelected = selectedKey !== undefined && selectedKey === id;
                const isClickable = Boolean(onRowClick);

                return (
                  <tr
                    key={id}
                    aria-selected={isSelected || undefined}
                    className={clsx(isClickable && 'is-link')}
                    onClick={isClickable ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => {
                      const val = row[col.key];
                      const rendered = col.render ? col.render(val, row, idx) : (val ?? '—');
                      return (
                        <td
                          key={col.key}
                          className={clsx(col.align === 'right' && 'aa-col-num', col.className)}
                        >
                          {rendered}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="aa-pager">
          <div>
            {pagination.totalItems !== undefined ? (
              <span>Jami: <strong className="aa-num">{pagination.totalItems}</strong></span>
            ) : (
              <span>Sahifa <strong className="aa-num">{pagination.page}</strong> / {pagination.totalPages}</span>
            )}
          </div>
          <div className="aa-pager__btns">
            <button
              type="button"
              className="aa-pager__btn"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange?.(pagination.page - 1)}
              aria-label="Oldingi sahifa"
            >
              <ChevronLeft className="aa-icon" aria-hidden="true" />
            </button>
            {Array.from({ length: Math.min(pagination.totalPages || 1, 5) }).map((_, i) => {
              const pNum = i + 1;
              const isCurrent = pNum === pagination.page;
              return (
                <button
                  key={pNum}
                  type="button"
                  aria-current={isCurrent ? 'page' : undefined}
                  className="aa-pager__btn"
                  onClick={() => pagination.onPageChange?.(pNum)}
                >
                  {pNum}
                </button>
              );
            })}
            <button
              type="button"
              className="aa-pager__btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange?.(pagination.page + 1)}
              aria-label="Keyingi sahifa"
            >
              <ChevronRight className="aa-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

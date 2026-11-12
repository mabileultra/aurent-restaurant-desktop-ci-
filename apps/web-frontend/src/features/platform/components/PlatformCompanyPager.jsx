import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import Select from '../../../components/aa/Select';

/**
 * PlatformCompanyPager — Kompaniyalar jadvali sahifalagichi.
 * Elementlar: «1–10 / 115» · «Sahifada» + select · 32px sahifa tugmalari.
 * Mobilda ustma-ust joylashadi.
 */
export default function PlatformCompanyPager({
  page = 0,
  pageSize = 14,
  total = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 14, 20, 50],
}) {
  if (total === 0) return null;

  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);
  const currentPage = page + 1; // 1-based for display

  // Sahifa raqamlari (maksimal 5 ta ko‘rsatish)
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = startPage + maxButtons - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i += 1) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-aa-line text-sm bg-aa-surface">
      {/* Chap: «1–10 / 115» va «Sahifada» select */}
      <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
        <span className="text-aa-ink tabular-nums text-sm font-medium">
          {start}–{end} / {total}
        </span>

        <div className="flex items-center gap-2">
          <label htmlFor="company-pagesize-select" className="text-xs text-aa-ink-muted">
            Sahifada
          </label>
          <Select
            id="company-pagesize-select"
            value={pageSize}
            onChange={(val) => onPageSizeChange?.(Number(val))}
            options={pageSizeOptions.map((sz) => ({ value: sz, label: String(sz) }))}
            size="sm"
            searchable={false}
            className="w-[80px]"
          />
        </div>
      </div>

      {/* O‘ng: Sahifa tugmalari */}
      <div className="flex items-center gap-1">
        {/* Oldingi */}
        <button
          type="button"
          onClick={() => onPageChange?.(page - 1)}
          disabled={page <= 0}
          aria-label="Oldingi sahifa"
          className="h-8 min-w-[32px] px-2 rounded-aa-md inline-flex items-center justify-center text-sm font-medium transition-colors border border-transparent disabled:opacity-40 disabled:cursor-not-allowed hover:bg-aa-surface-hover text-aa-ink"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          <span className="hidden sm:inline ml-1 text-xs">Oldingi</span>
        </button>

        {/* Raqamlar */}
        {pages.map((pNum) => {
          const isCurrent = pNum === currentPage;
          return (
            <button
              key={pNum}
              type="button"
              aria-current={isCurrent ? 'page' : undefined}
              onClick={() => onPageChange?.(pNum - 1)}
              className={clsx(
                'h-8 min-w-[32px] px-2 rounded-aa-md inline-flex items-center justify-center text-xs font-semibold tabular-nums transition-colors',
                isCurrent
                  ? 'bg-aa-brand-soft text-aa-brand'
                  : 'hover:bg-aa-surface-hover text-aa-ink'
              )}
            >
              {pNum}
            </button>
          );
        })}

        {/* Keyingi */}
        <button
          type="button"
          onClick={() => onPageChange?.(page + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Keyingi sahifa"
          className="h-8 min-w-[32px] px-2 rounded-aa-md inline-flex items-center justify-center text-sm font-medium transition-colors border border-transparent disabled:opacity-40 disabled:cursor-not-allowed hover:bg-aa-surface-hover text-aa-ink"
        >
          <span className="hidden sm:inline mr-1 text-xs">Keyingi</span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

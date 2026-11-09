import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function KorxonaReceiptsPagination({
  page = 0,
  from = 0,
  to = 0,
  totalCount = 0,
  totalPages = 1,
  onPrevPage,
  onNextPage,
}) {
  return (
    <div className="p-3 sm:px-5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex flex-wrap justify-between items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 font-semibold">
          {totalCount > 0 ? `${from}–${to} / ${totalCount} ta chek` : '0 ta chek'}
        </span>
        <span className="hidden sm:inline text-slate-400">· chekni bosing, o‘ng tomonda ochiladi</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevPage}
          disabled={page <= 0}
          aria-label="Oldingi 10 ta chek"
          className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-35 disabled:cursor-not-allowed inline-flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Oldingi</span>
        </button>

        <button
          type="button"
          onClick={onNextPage}
          disabled={page >= totalPages - 1}
          aria-label="Keyingi 10 ta chek"
          className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-35 disabled:cursor-not-allowed inline-flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <span className="hidden sm:inline">Keyingi</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default KorxonaReceiptsPagination;

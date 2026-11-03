import React from 'react';
import { Copy, RotateCcw, SlidersHorizontal, X } from 'lucide-react';

/**
 * Xodimlar ro'yxatida tanlanganlar uchun ommaviy amallar paneli (SRP)
 */
export default function RoleEmployeesBulkBar({
  selectedCount = 0,
  canCopy = false,
  onApply,
  onBulkReset,
  onCopy,
  onClear,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between bg-emerald-50/90 border-b border-emerald-200/80 px-6 py-2.5 text-xs dark:bg-emerald-950/40 dark:border-emerald-900 shrink-0 animate-in fade-in duration-150">
      <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold">
        <span>Tanlangan: {selectedCount} ta xodim</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {canCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/40 bg-white text-emerald-900 font-bold px-3 py-1.5 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-100 cursor-pointer"
          >
            <Copy size={12} />
            <span>Nusxa (REPLACE)</span>
          </button>
        )}
        <button
          type="button"
          onClick={onBulkReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-bold px-3 py-1.5 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
        >
          <RotateCcw size={12} />
          <span>Shablonga</span>
        </button>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3 py-1.5 transition-colors cursor-pointer"
        >
          <SlidersHorizontal size={12} />
          <span>Tanlanganlarga qo‘llash</span>
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label="Tanlovni bekor qilish"
          className="rounded-lg p-1 text-slate-500 hover:text-slate-700 hover:bg-emerald-100/60 dark:hover:bg-emerald-900 cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

/**
 * Xodimlar ro'yxatida tanlanganlar uchun ommaviy amallar paneli (SRP)
 */
export default function RoleEmployeesBulkBar({
  selectedCount = 0,
  onApply,
  onClear,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between bg-emerald-50/90 border-b border-emerald-200/80 px-6 py-2.5 text-xs dark:bg-emerald-950/40 dark:border-emerald-900 shrink-0 animate-in fade-in duration-150">
      <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold">
        <span>Tanlangan: {selectedCount} ta xodim</span>
      </div>
      <div className="flex items-center gap-2">
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

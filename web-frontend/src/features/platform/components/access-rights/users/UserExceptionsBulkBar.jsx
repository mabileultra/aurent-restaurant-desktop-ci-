import React from 'react';
import { RotateCcw, Copy, X } from 'lucide-react';

export default function UserExceptionsBulkBar({
  selectedCount,
  onResetToTemplate,
  onCopyPermissions,
  onClearSelection,
}) {
  if (selectedCount <= 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/90 bg-emerald-50/95 p-3 sm:px-4 shadow-md backdrop-blur-xs dark:border-emerald-900/60 dark:bg-emerald-950/90 animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
        <span className="rounded-full bg-emerald-600 text-white px-2 py-0.5 text-xs font-bold dark:bg-emerald-500">
          {selectedCount}
        </span>
        <span>xodim tanlandi · Ommaviy amal qo‘llash mumkin</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onResetToTemplate}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300"
        >
          <RotateCcw size={13} />
          <span>Shablonga qaytarish</span>
        </button>

        <button
          type="button"
          onClick={onCopyPermissions}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer dark:bg-emerald-500"
        >
          <Copy size={13} />
          <span>Huquqdan nusxa qo‘llash</span>
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          className="rounded-xl p-1.5 text-slate-500 hover:bg-emerald-100 hover:text-slate-800 transition-colors cursor-pointer dark:text-slate-400 dark:hover:bg-slate-800"
          title="Tanlovni bekor qilish"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

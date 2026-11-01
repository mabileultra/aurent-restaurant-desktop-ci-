import React from 'react';
import { AlertCircle, Check, RotateCcw } from 'lucide-react';

export default function RoleTemplateBlastRadiusFooter({
  unsavedCount,
  affectedCount,
  onReset,
  onSave,
  isSaving,
}) {
  if (unsavedCount <= 0) return null;

  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/95 p-3.5 sm:px-5 sm:py-3.5 shadow-lg backdrop-blur-xs dark:border-amber-900/60 dark:bg-amber-950/90 animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-200">
        <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong className="font-bold">{unsavedCount} ta o‘zgarish saqlanmagan</strong> · {affectedCount} xodimga ta‘sir qiladi
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RotateCcw size={13} />
          <span>Bekor qilish</span>
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          <Check size={14} />
          <span>{isSaving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
        </button>
      </div>
    </div>
  );
}

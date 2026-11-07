import React from 'react';

export default function PlatformSecurityRulesStickyBar({
  dirtyCount,
  onReset,
  onSave,
}) {
  const isDirty = dirtyCount > 0;

  return (
    <div
      className={`sticky bottom-2 z-20 w-full rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border shadow-lg transition-all ${
        isDirty
          ? 'bg-slate-900 dark:bg-slate-950 text-white border-slate-700'
          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center gap-2.5 text-xs">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
          }`}
        />
        <div>
          <span className="font-bold">
            {isDirty ? `${dirtyCount} ta qoida o‘zgartirildi (Ko‘rish rejimi)` : 'Qoidalar ko‘rish rejimida'}
          </span>
          <p className={`text-[11px] ${isDirty ? 'text-amber-200' : 'text-slate-400'}`}>
            Kirish qoidalarini serverda saqlash backend integratsiyasi yakunlangach to‘liq ishga tushadi
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {isDirty && (
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-400 text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            onClick={onReset}
          >
            Bekor qilish
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <span>Qoidalarni saqlash</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-900/80 text-emerald-200">
            Tez kunda
          </span>
        </button>
      </div>
    </div>
  );
}

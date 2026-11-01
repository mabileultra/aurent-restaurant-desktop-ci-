import React from 'react';
import { Lock } from 'lucide-react';

/**
 * Rol shablonini ko'rish yon panelining pastki qismi (Faqat ko'rish / Tez kunda rejimi)
 */
export default function RoleTemplateDrawerFooter({ onClose }) {
  return (
    <footer className="border-t border-slate-100 bg-slate-50/90 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-850 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
            <Lock size={11} />
            <span>Tez kunda</span>
          </span>
          <span className="font-medium text-slate-600 dark:text-slate-400">
            Rol shablonini tahrirlash imkoniyati tez kunda ishga tushadi
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
          >
            Yopish
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Backend endpointi ulanishi kutilmoqda"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-4 py-2 text-xs font-bold cursor-not-allowed border border-slate-300/60 dark:border-slate-700"
          >
            <span>Saqlash (Tez kunda)</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

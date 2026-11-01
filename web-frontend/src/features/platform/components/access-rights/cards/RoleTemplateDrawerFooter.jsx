import React from 'react';
import { Check } from 'lucide-react';

/**
 * Rol shablonini tahrirlash yon panelining pastki qismi (O'zgarishlar va Saqlash)
 */
export default function RoleTemplateDrawerFooter({
  unsavedCount = 0,
  isSaving = false,
  onClose,
  onSave,
}) {
  return (
    <footer className="border-t border-slate-100 bg-slate-50/80 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-850 shrink-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {unsavedCount > 0 ? (
            <strong className="text-amber-700 dark:text-amber-400">
              {unsavedCount} ta modul o‘zgartirildi
            </strong>
          ) : (
            'Barcha o‘zgarishlar saqlangan'
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Yopish
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={unsavedCount === 0 || isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-40 dark:bg-emerald-600"
          >
            <Check size={14} />
            <span>{isSaving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

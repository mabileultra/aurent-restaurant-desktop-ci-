import React from 'react';

/**
 * Role template drawer footer: save + applyToExisting.
 */
export default function RoleTemplateDrawerFooter({
  onClose,
  onSave,
  isDirty,
  isSaving,
  applyToExisting,
  onApplyToExistingChange,
}) {
  return (
    <footer className="border-t border-slate-100 bg-slate-50/90 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-850 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(applyToExisting)}
            onChange={(e) => onApplyToExistingChange?.(e.target.checked)}
            className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
          />
          <span className="font-medium">
            Istisnosiz xodimlarga qo‘llash
          </span>
        </label>
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
            onClick={onSave}
            disabled={!isDirty || isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 text-white px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-800"
          >
            <span>{isSaving ? 'Saqlanmoqda…' : 'Saqlash'}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * UserFormDiscardModal
 * Alert dialog confirming exit when user has unsaved changes.
 */
export default function UserFormDiscardModal({
  t,
  dialogRef,
  keepEditingBtnRef,
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="discard-confirm-title"
      aria-describedby="discard-confirm-desc"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 id="discard-confirm-title" className="text-base font-bold text-slate-900 dark:text-white">
              {t('users.discardChangesTitle', { defaultValue: 'O‘zgarishlar saqlanmadi' })}
            </h3>
            <p id="discard-confirm-desc" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('users.discardChangesDesc', { defaultValue: 'Kiritilgan barcha ma’lumotlar yo‘qoladi. Rostdan ham chiqishni xohlaysizmi?' })}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            ref={keepEditingBtnRef}
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {t('users.discardChangesKeepEditing', { defaultValue: 'Tahrirlashda qolish' })}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors cursor-pointer"
          >
            {t('users.discardChangesDiscard', { defaultValue: 'O‘zgarishlarni bekor qilish' })}
          </button>
        </div>
      </div>
    </div>
  );
}

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
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/70 animate-in fade-in duration-150"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="discard-confirm-title"
      aria-describedby="discard-confirm-desc"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-aa-lg bg-aa-surface p-6 shadow-aa-modal border border-aa-line space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-aa-md bg-aa-warning-soft text-aa-warning shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 id="discard-confirm-title" className="text-base font-bold text-aa-ink">
              {t('users.discardChangesTitle', { defaultValue: 'O‘zgarishlar saqlanmadi' })}
            </h3>
            <p id="discard-confirm-desc" className="text-xs text-aa-ink-muted mt-1">
              {t('users.discardChangesDesc', { defaultValue: 'Kiritilgan barcha ma’lumotlar yo‘qoladi. Rostdan ham chiqishni xohlaysizmi?' })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          <button
            ref={keepEditingBtnRef}
            type="button"
            onClick={onCancel}
            className="aa-btn aa-btn--secondary aa-size-md cursor-pointer whitespace-nowrap"
          >
            {t('users.discardChangesKeepEditing', { defaultValue: 'Tahrirlashda qolish' })}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="aa-btn aa-btn--danger aa-size-md cursor-pointer whitespace-nowrap"
          >
            {t('users.discardChangesDiscard', { defaultValue: 'O‘zgarishlarni bekor qilish' })}
          </button>
        </div>
      </div>
    </div>
  );
}

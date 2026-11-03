import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function PlatformLeadDeleteConfirmModal({
  isOpen,
  leadName,
  onClose,
  onConfirm,
  isDeleting,
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Arizani o'chirish</h3>
            <p className="text-xs text-slate-500">
              «<span className="font-semibold text-slate-700 dark:text-slate-300">{leadName}</span>» arizasini o'chirishni tasdiqlaysizmi?
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>{isDeleting ? 'O\'chirilmoqda…' : 'Ha, o\'chirilsin'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

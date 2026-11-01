import React from 'react';
import { X, Clock } from 'lucide-react';
import PermissionHistoryTab from '../history/PermissionHistoryTab';

/**
 * O'zgarishlar tarixi modali
 * Pastki chapdagi "↺ O'zgarishlar tarixi" tugmasi bosilganda ochiladi
 */
export default function RoleHistoryModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                O‘zgarishlar tarixi va audit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shablon va istisno o‘zgarishlari, 1-bosishda qaytarish (Rollback) imkoniyati bilan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <PermissionHistoryTab />
        </div>

        <footer className="border-t border-slate-100 px-6 py-3 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-850 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Yopish
          </button>
        </footer>
      </div>
    </div>
  );
}

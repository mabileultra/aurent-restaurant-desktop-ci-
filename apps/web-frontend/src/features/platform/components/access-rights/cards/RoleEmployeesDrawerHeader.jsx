import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function RoleEmployeesDrawerHeader({
  role,
  businessTypeName,
  totalCount,
  exceptionsCount,
  closeButtonRef,
  onClose,
}) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 shrink-0">
        <div>
          <h3 id="employees-drawer-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{role.name} xodimlari</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">· {businessTypeName}</span>
          </h3>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
            Jami {totalCount} ta xodim · {exceptionsCount} tasida istisno bor
          </p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Panelni yopish"
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X size={18} />
        </button>
      </header>

      {totalCount >= 250 && (
        <div className="bg-amber-50/80 border-b border-amber-200/60 px-6 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 flex items-center gap-1.5 shrink-0">
          <AlertCircle size={13} className="shrink-0 text-amber-700" />
          <span>Dastlabki 250 ta xodim ko‘rsatilmoqda (Jami: {totalCount} ta). Qidiruvdan foydalaning.</span>
        </div>
      )}
    </>
  );
}

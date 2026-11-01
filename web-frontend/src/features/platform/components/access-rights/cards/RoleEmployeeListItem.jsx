import React from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';

/**
 * Xodimlar ro'yxatidagi bitta xodim kartochkasi
 */
export default function RoleEmployeeListItem({
  user,
  businessTypeName,
  isSelected = false,
  onToggleSelect,
  onResetClick,
  onEditClick,
}) {
  const hasExceptions = Boolean(user.moduleAccessCustom || user.customAccess || user.hasExceptions);
  const initials = (user.fullName || user.username || 'U').substring(0, 2).toUpperCase();
  const userId = user.userId || user.id;

  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-950/20'
          : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-850'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(userId)}
            aria-label={`${user.fullName || user.username}ni tanlash`}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
          />
        )}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user.fullName || user.username}
            </span>
            {hasExceptions ? (
              <span className="rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-300">
                Istisno bor
              </span>
            ) : (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Shablon
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
            {user.username} · {user.companyName || businessTypeName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <button
          type="button"
          onClick={() => onEditClick?.(user)}
          aria-label={`${user.fullName || user.username} huquqlarini sozlash`}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 text-[11px] font-semibold dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900 cursor-pointer"
        >
          <SlidersHorizontal size={11} />
          <span>Sozlash</span>
        </button>
        {hasExceptions && (
          <button
            type="button"
            onClick={() => onResetClick?.(user)}
            aria-label={`${user.fullName || user.username}ni shablonga qaytarish`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <RotateCcw size={11} />
            <span>Shablonga</span>
          </button>
        )}
      </div>
    </div>
  );
}

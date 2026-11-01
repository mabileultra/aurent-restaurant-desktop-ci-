import React from 'react';
import RoleCardBreakdown from './RoleCardBreakdown';

/**
 * Bitta rol kartasi (Admin, Menejer, Kassir, Ofitsiant, Oshpaz)
 * WCAG AA kontrasti va to'liq o'qiluvchanlik ta'minlangan
 */
export default function RoleCard({
  role,
  onConfigure,
  onViewEmployees,
  isCompact = false,
}) {
  const {
    name,
    totalEmployees = 0,
    exceptionCount = 0,
    enabledModulesCount = 0,
    totalModulesCount = 1,
    breakdown = [],
  } = role;

  const percentage = totalModulesCount > 0
    ? Math.round((enabledModulesCount / totalModulesCount) * 100)
    : 0;

  if (isCompact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/80 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {name ? name.slice(0, 2).toUpperCase() : 'RL'}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {name}
            </h4>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              0 xodim · {enabledModulesCount}/{totalModulesCount} modul ({percentage}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onConfigure(role)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            Ko‘rish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
      <div>
        {/* Yuqori qator: Rol nomi va istisno nishoni */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {name}
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
              {totalEmployees} xodim
            </p>
          </div>
          {exceptionCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-100 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900 shrink-0">
              {exceptionCount} istisno
            </span>
          )}
        </div>

        {/* Modullar statistikasi va foiz */}
        <div className="flex items-baseline justify-between mt-4">
          <div className="text-slate-900 dark:text-white">
            <span className="text-xl font-extrabold tracking-tight">
              {enabledModulesCount}
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 ml-1">
              / {totalModulesCount} modul
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
            {percentage}%
          </span>
        </div>

        {/* Yashil progress indikatori */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1 mb-2">
          <div
            className="h-full bg-emerald-800 dark:bg-emerald-600 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>

        {/* Modul guruhlari statistikasi */}
        <RoleCardBreakdown items={breakdown} />
      </div>

      {/* Kartochka amallari: Sozlash va Xodimlar */}
      <div className="flex items-center gap-2 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => onConfigure(role)}
          aria-label={`${name} rolini ko‘rish`}
          className="flex-1 rounded-xl bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-800 dark:hover:bg-emerald-700 text-white font-semibold py-2 px-3 text-xs transition-colors cursor-pointer text-center"
        >
          Sozlash
        </button>
        <button
          type="button"
          onClick={() => onViewEmployees(role)}
          aria-label={`${name} xodimlarini ko‘rish`}
          className="rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3.5 text-xs transition-colors cursor-pointer"
        >
          Xodimlar
        </button>
      </div>
    </div>
  );
}

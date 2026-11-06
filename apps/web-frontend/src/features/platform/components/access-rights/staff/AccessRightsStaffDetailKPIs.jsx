import React from 'react';

/**
 * AccessRightsStaffDetailKPIs
 * Displays 4 metric pills for employee's active permissions breakdown
 */
export default function AccessRightsStaffDetailKPIs({
  templateCount = 0,
  addedCount = 0,
  blockedCount = 0,
  finalCount = 0,
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-w-0">
        <div className="text-[10px] text-slate-500 font-medium truncate">Shablondan</div>
        <div className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
          {templateCount} modul
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 min-w-0">
        <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium truncate">
          Qo‘shimcha ruxsat
        </div>
        <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 truncate">
          +{addedCount}
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 min-w-0">
        <div className="text-[10px] text-rose-700 dark:text-rose-300 font-medium truncate">
          Taqiqlangan
        </div>
        <div className="text-base font-bold text-rose-700 dark:text-rose-400 truncate">
          −{blockedCount}
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-w-0">
        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">
          Yakuniy kirish
        </div>
        <div className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
          {finalCount} modul
        </div>
      </div>
    </div>
  );
}

import React from 'react';

/**
 * Rol kartasi ichidagi modul guruhlari statistikasi
 * To'liq o'qilishi uchun bitta ustunli qulay ro'yxat (C.14 talabi)
 */
export default function RoleCardBreakdown({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 text-xs my-3 divide-y divide-slate-100 dark:divide-slate-800/60">
      {items.map((item, idx) => (
        <div
          key={`${item.name}-${idx}`}
          className="flex items-center justify-between pt-1.5 first:pt-0 text-xs"
        >
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {item.name}
          </span>
          <span className="font-semibold text-slate-900 dark:text-white tabular-nums shrink-0 ml-2">
            {item.enabled}/{item.total}
          </span>
        </div>
      ))}
    </div>
  );
}

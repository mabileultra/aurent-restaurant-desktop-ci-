import React from 'react';

/**
 * Rol kartasi ichidagi 2 ustunli modul guruhlari statistikasi
 * Misol: Asosiy 2/3 | Tovarlar 1/1
 */
export default function RoleCardBreakdown({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs my-3 min-h-[44px]">
      {items.map((item, idx) => (
        <div key={`${item.name}-${idx}`} className="flex items-center justify-between text-[11px]">
          <span className="truncate pr-1 text-slate-600 dark:text-slate-400 font-medium">
            {item.name}
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums shrink-0">
            {item.enabled}/{item.total}
          </span>
        </div>
      ))}
    </div>
  );
}

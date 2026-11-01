import React from 'react';

/**
 * Gorizontal faoliyat turlari tugmalari (pills)
 * PDF dizayniga muvofiq: Restoran 145 xodim, Dorixona 19 xodim, ...
 */
export default function BusinessTypePills({
  businessTypes = [],
  selectedCode,
  onSelect,
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist">
      {businessTypes.map((bt) => {
        const isSelected = bt.code === selectedCode;
        return (
          <button
            key={bt.code}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(bt.code)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              isSelected
                ? 'bg-emerald-900 text-white shadow-xs dark:bg-emerald-800'
                : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-850'
            }`}
          >
            <span className="font-semibold">{bt.name}</span>
            <span
              className={`text-xs ${
                isSelected ? 'text-emerald-200/90' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {bt.totalEmployees} xodim
            </span>
          </button>
        );
      })}
    </div>
  );
}

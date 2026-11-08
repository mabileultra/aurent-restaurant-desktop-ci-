import React from 'react';

export default function ViloyatBusinessTypeBar({ types, activeType, onSelectType }) {
  return (
    <div
      role="group"
      aria-label="Faoliyat turi bo‘yicha ajratish"
      className="flex flex-wrap gap-1 p-1 bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-xs"
    >
      {types.map((t) => {
        const isActive = t.id === activeType;
        return (
          <button
            key={t.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectType(t.id)}
            className={`flex-1 min-w-[130px] sm:min-w-[150px] h-11 sm:h-12 px-3 sm:px-4 rounded-lg inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition cursor-pointer select-none ${
              isActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`min-w-6 h-5 px-1.5 rounded-full inline-flex items-center justify-center text-xs font-bold tabular-nums ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {t.n}
            </span>
          </button>
        );
      })}
    </div>
  );
}

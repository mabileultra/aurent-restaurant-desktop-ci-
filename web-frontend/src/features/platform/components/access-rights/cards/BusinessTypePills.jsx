import React, { useMemo } from 'react';
import PlatformSelect from '../../PlatformSelect';

/**
 * Faoliyat turlari tanlagichi:
 * - Mobilda toza PlatformSelect (ekrandan chiqib ketmaslik uchun, C.15)
 * - Desktopda flex-wrap pills (gorizontal scrollbarni yo'qotish uchun)
 * - WCAG AA kontrasti ta'minlangan (C.17)
 */
export default function BusinessTypePills({
  businessTypes = [],
  selectedCode,
  onSelect,
}) {
  const selectOptions = useMemo(
    () =>
      businessTypes.map((bt) => ({
        value: bt.code,
        label: bt.totalEmployees != null ? `${bt.name} (${bt.totalEmployees} xodim)` : bt.name,
      })),
    [businessTypes]
  );

  return (
    <div className="w-full space-y-2">
      {/* Mobil ko'rinish: PlatformSelect ochiladigan menyusi */}
      <div className="sm:hidden w-full">
        <label htmlFor="mobile-bt-select" className="sr-only">
          Faoliyat turini tanlang
        </label>
        <PlatformSelect
          id="mobile-bt-select"
          options={selectOptions}
          value={selectedCode}
          onChange={(e) => onSelect?.(e.target.value)}
          ariaLabel="Faoliyat turini tanlash"
          className="w-full"
        />
      </div>

      {/* Desktop ko'rinish: Flex-wrap tugmalar (hech qanday kulrang scrollbar yo'q) */}
      <div
        className="hidden sm:flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Faoliyat turlari"
      >
        {businessTypes.map((bt) => {
          const isSelected = bt.code === selectedCode;
          return (
            <button
              key={bt.code}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelect?.(bt.code)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-emerald-900 text-white shadow-xs dark:bg-emerald-800'
                  : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-850'
              }`}
            >
              <span>{bt.name}</span>
              {bt.totalEmployees != null && (
                <span
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-emerald-100' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {bt.totalEmployees} xodim
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

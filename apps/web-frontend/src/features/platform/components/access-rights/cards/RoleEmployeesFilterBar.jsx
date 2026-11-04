import React from 'react';
import { Search } from 'lucide-react';

/**
 * Xodimlar ro'yxati panelidagi qidiruv, filtr tugmalari va barchasini tanlash (SRP)
 */
export default function RoleEmployeesFilterBar({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  totalCount = 0,
  exceptionsCount = 0,
  isAllSelected = false,
  onSelectAll,
}) {
  const filterTabs = [
    { id: 'ALL', label: `Hammasi (${totalCount})` },
    { id: 'EXCEPTIONS', label: `Istisnoli (${exceptionsCount})` },
    { id: 'TEMPLATE', label: `Faqat shablon (${totalCount - exceptionsCount})` },
  ];

  return (
    <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ism, login yoki kompaniya..."
          aria-label="Xodimlar bo‘yicha qidiruv"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterTabs.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id)}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                filterType === f.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {onSelectAll && totalCount > 0 && (
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-[11px]">Barchasi</span>
          </label>
        )}
      </div>
    </div>
  );
}

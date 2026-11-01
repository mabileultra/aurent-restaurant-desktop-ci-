import React from 'react';
import { Search } from 'lucide-react';

/**
 * Xodimlar ro'yxati panelidagi qidiruv va filtr tugmalari (SRP)
 */
export default function RoleEmployeesFilterBar({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  totalCount = 0,
  exceptionsCount = 0,
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
      <div className="flex items-center gap-1.5 text-xs">
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
    </div>
  );
}

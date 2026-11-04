import React from 'react';
import { X, Search, Users } from 'lucide-react';

export default function RoleEmployeeBulkHeader({
  selectedCount,
  roleName,
  businessTypeName,
  searchQuery,
  setSearchQuery,
  filterMode,
  setFilterMode,
  onClose,
  closeButtonRef,
}) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 shrink-0">
        <div>
          <h3 id="bulk-edit-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users size={16} className="text-emerald-700" />
            <span>Ommaviy huquq berish</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">· {businessTypeName}</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Tanlangan <strong>{selectedCount} ta {roleName || 'xodim'}</strong> uchun modullarni birvarakay tatbiq etish
          </p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Panelni yopish"
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X size={18} />
        </button>
      </header>

      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Modul nomi..."
            aria-label="Modullarni qidirish"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
        <div className="flex items-center gap-1 text-xs">
          {['ALL', 'ENABLED', 'DISABLED'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFilterMode(m)}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                filterMode === m ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              {m === 'ALL' ? 'Barchasi' : m === 'ENABLED' ? 'Yoqilgan' : 'O‘chirilgan'}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

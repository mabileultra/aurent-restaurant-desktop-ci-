import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export default function UserExceptionsList({
  users = [],
  selectedUserId,
  onSelectUser,
  selectedUserIds = new Set(),
  onToggleUserCheck,
  onSelectAllVisible,
}) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'EXCEPTIONS' | 'NEW'

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (filterType === 'EXCEPTIONS' && !u.hasExceptions) return false;
      if (filterType === 'NEW' && !u.isNew) return false;
      if (q) {
        const match =
          u.fullName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.companyName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [users, search, filterType]);

  const allVisibleSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.id));

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 p-3 sm:p-4 space-y-3 dark:border-slate-800">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, login yoki kompaniya..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white dark:border-slate-800 dark:bg-slate-850 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            {[
              { id: 'ALL', label: `Hammasi 338` },
              { id: 'EXCEPTIONS', label: `Istisnoli 44` },
              { id: 'NEW', label: `Yangi 36` },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilterType(chip.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  filterType === chip.id
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-medium text-slate-400">
            {filteredUsers.length} ko‘rsatildi
          </span>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={() => onSelectAllVisible(filteredUsers)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <span>Ko‘rinayotgan {filteredUsers.length} xodimni tanlash</span>
        </label>
      </div>

      <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
        {filteredUsers.map((u) => {
          const isSelected = selectedUserId === u.id;
          const isChecked = selectedUserIds.has(u.id);

          return (
            <div
              key={u.id}
              onClick={() => onSelectUser(u.id)}
              className={`flex items-center justify-between gap-3 rounded-xl p-2.5 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-emerald-50/70 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => onToggleUserCheck(u.id)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {u.initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {u.fullName}
                    </span>
                    {u.isNew && (
                      <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        YANGI
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {u.username} · {u.role} · {u.companyName}
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                {u.hasExceptions ? (
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:border-amber-900 dark:text-amber-300">
                    {u.exceptionCount} istisno
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400">
                    Shablon
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export default function RoleTemplatesSidebar({
  businessTypes,
  selectedBusinessType,
  selectedRole,
  onSelectRole,
}) {
  const [search, setSearch] = useState('');

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return businessTypes;
    return businessTypes
      .map((bt) => {
        const matchesBT = bt.name.toLowerCase().includes(q);
        const filteredRoles = bt.roles.filter((r) => r.name.toLowerCase().includes(q));
        if (matchesBT) return bt;
        if (filteredRoles.length > 0) return { ...bt, roles: filteredRoles };
        return null;
      })
      .filter(Boolean);
  }, [businessTypes, search]);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 p-3 sm:p-4 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Shablonlar · faoliyat turi › rol
        </h3>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rol yoki faoliyat turi..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white dark:border-slate-800 dark:bg-slate-850 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="max-h-[640px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-3">
        {filteredGroups.map((group) => (
          <div key={group.code} className="pt-2 first:pt-0">
            <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="uppercase tracking-wider">{group.name}</span>
              <span className="text-[11px] font-normal text-slate-400">{group.totalEmployees} xodim</span>
            </div>
            <div className="mt-1 space-y-0.5">
              {group.roles.map((r) => {
                const isSelected =
                  selectedBusinessType === group.code && selectedRole === r.code;
                return (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => onSelectRole(group.code, r.code)}
                    className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {r.totalEmployees} xodim · {r.exceptionCount > 0 ? `${r.exceptionCount} ta istisno` : 'istisnosiz'}
                      </span>
                    </div>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        isSelected
                          ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {r.enabledModulesCount}/{r.totalModulesCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

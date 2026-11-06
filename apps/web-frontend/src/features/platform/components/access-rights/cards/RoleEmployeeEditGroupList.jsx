import React from 'react';

/**
 * Xodim huquqlarini tahrirlash oynasidagi guruhlar va modullar ro'yxati (SRP)
 */
export default function RoleEmployeeEditGroupList({
  catalogGroups = [],
  moduleToggles = {},
  defaultsMap = new Map(),
  filterMode = 'ALL',
  searchQuery = '',
  onToggle,
}) {
  const q = searchQuery.toLowerCase().trim();

  return (
    <div className="space-y-4">
      {catalogGroups.map((group) => {
        const matched = group.modules.filter((m) => {
          const isEnabled = Boolean(moduleToggles[m.id]);
          if (filterMode === 'ENABLED' && !isEnabled) return false;
          if (filterMode === 'DISABLED' && isEnabled) return false;
          if (q) return m.name.toLowerCase().includes(q);
          return true;
        });

        if (matched.length === 0) return null;

        return (
          <div key={group.id} className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-850">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">{group.title}</h4>
            <div className="space-y-1.5">
              {matched.map((m) => {
                const isChecked = Boolean(moduleToggles[m.id]);
                const isDefault = defaultsMap.get(m.id);
                return (
                  <label key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <div className="min-w-0 pr-2">
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{m.name}</span>
                      <span className="block text-[10px] text-slate-400">Rol bo‘yicha: {isDefault ? 'yoqilgan' : 'o‘chirilgan'}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggle?.(m.id)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

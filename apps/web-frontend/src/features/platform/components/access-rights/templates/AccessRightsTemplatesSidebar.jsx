import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Users, Shield } from 'lucide-react';

export default function AccessRightsTemplatesSidebar({
  groupedTemplates = [],
  selectedBT,
  selectedRole,
  onSelectRole,
}) {
  const [search, setSearch] = useState('');
  const [collapsedBTs, setCollapsedBTs] = useState({});
  const activeRoleRef = React.useRef(null);

  React.useEffect(() => {
    if (activeRoleRef.current) {
      activeRoleRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedBT, selectedRole]);

  const toggleBT = (btCode) => {
    setCollapsedBTs((prev) => ({ ...prev, [btCode]: !prev[btCode] }));
  };

  const cleanSearch = search.trim().toLowerCase();

  const filteredGroups = groupedTemplates
    .map((bt) => {
      const btMatches = bt.name.toLowerCase().includes(cleanSearch);
      const matchedRoles = (bt.roles || []).filter(
        (r) => btMatches || r.name.toLowerCase().includes(cleanSearch)
      );
      return { ...bt, roles: matchedRoles };
    })
    .filter((bt) => bt.roles.length > 0);

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
        <span>Shablonlar</span>
        <span className="text-[11px] font-normal text-slate-500">faoliyat turi › rol</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rol yoki faoliyat turi..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
        {filteredGroups.map((bt) => {
          const isSelectedBT = selectedBT === bt.code;
          const isCollapsed = Boolean(collapsedBTs[bt.code]) && !isSelectedBT && !cleanSearch;
          return (
            <div key={bt.code} className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleBT(bt.code)}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 text-left border-b border-slate-100 dark:border-slate-800 cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                  {isCollapsed ? <ChevronRight size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                  <span>{bt.name}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {bt.totalEmployees || 0} xodim
                </span>
              </button>

              {!isCollapsed && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {bt.roles.map((r) => {
                    const isSelected = selectedBT === bt.code && selectedRole === r.code;
                    return (
                      <button
                        key={r.code}
                        ref={isSelected ? activeRoleRef : null}
                        type="button"
                        onClick={() => onSelectRole(bt.code, r.code)}
                        className={`w-full flex items-center justify-between p-2.5 text-left text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-l-4 border-l-emerald-600'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{r.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{r.totalEmployees || 0} xodim</span>
                            {r.exceptionCount > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 ml-1">
                                · {r.exceptionCount} ta istisno
                              </span>
                            ) : (
                              <span className="ml-1 text-slate-400">· istisnosiz</span>
                            )}
                          </div>
                        </div>

                        <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {r.enabledModulesCount || 0}/{r.totalModulesCount || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

import React, { useState, useMemo } from 'react';
import { Table, Copy, Users, Info, Search } from 'lucide-react';
import RoleTemplateModuleGroupCard from './RoleTemplateModuleGroupCard';

export default function RoleTemplateEditor({
  businessTypeName,
  roleName,
  enabledCount,
  totalCount,
  employeeCount,
  exceptionCount,
  moduleGroups = [],
  activeModules = new Set(),
  dirtyModules = new Map(),
  onToggleModule,
  onEnableAllInGroup,
  onDisableAllInGroup,
  onOpenMatrix,
  onCopyFromOther,
  onViewEmployees,
}) {
  const [filterMode, setFilterMode] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return moduleGroups
      .map((group) => {
        const modules = group.modules.filter((m) => {
          const isEnabled = dirtyModules.has(m.id)
            ? dirtyModules.get(m.id)
            : activeModules.has(m.id);
          if (filterMode === 'ENABLED' && !isEnabled) return false;
          if (filterMode === 'DISABLED' && isEnabled) return false;
          if (q && !m.name.toLowerCase().includes(q)) return false;
          return true;
        });
        if (modules.length === 0) return null;
        return { ...group, modules };
      })
      .filter(Boolean);
  }, [moduleGroups, activeModules, dirtyModules, filterMode, search]);

  return (
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {businessTypeName} · rol shabloni
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {roleName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {enabledCount} / {totalCount} modul yoqilgan · {employeeCount} xodim · {exceptionCount} tasida istisno
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onViewEmployees}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-200 cursor-pointer"
          >
            <Users size={14} />
            <span>Shablondagi xodimlar</span>
          </button>
          <button
            type="button"
            onClick={onCopyFromOther}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-200 cursor-pointer"
          >
            <Copy size={14} />
            <span>Nusxa olish</span>
          </button>
          <button
            type="button"
            onClick={onOpenMatrix}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-200 cursor-pointer"
          >
            <Table size={14} />
            <span>Matritsa</span>
          </button>
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-center gap-2.5 rounded-xl border border-blue-200/60 bg-blue-50/50 p-3 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
        <Info size={16} className="shrink-0 text-blue-500" />
        <span>
          Shablondagi o‘zgarish shu shablondagi barcha xodimlarga qo‘llanadi. Xodimda istisno bo‘lsa, istisno qilingan modul o‘zgarmaydi.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Modul nomi..."
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-100"
          />
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
          {[
            { id: 'ALL', label: `Hammasi ${totalCount}` },
            { id: 'ENABLED', label: `Yoqilgan ${enabledCount}` },
            { id: 'DISABLED', label: `O‘chirilgan ${totalCount - enabledCount}` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                filterMode === tab.id
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modules Groups */}
      <div className="space-y-3">
        {filteredGroups.map((group) => (
          <RoleTemplateModuleGroupCard
            key={group.id}
            group={group}
            activeModules={activeModules}
            dirtyModules={dirtyModules}
            onToggleModule={onToggleModule}
            onEnableAllInGroup={onEnableAllInGroup}
            onDisableAllInGroup={onDisableAllInGroup}
          />
        ))}
      </div>
    </div>
  );
}

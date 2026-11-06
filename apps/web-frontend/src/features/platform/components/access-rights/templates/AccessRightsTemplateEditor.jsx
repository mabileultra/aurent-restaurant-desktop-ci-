import React, { useState } from 'react';
import { Users, Copy, Search, AlertCircle, Sparkles } from 'lucide-react';
import { BaseButton } from '../../../../../components/ui';
import AccessRightsModuleGroupAccordion from './AccessRightsModuleGroupAccordion';
import AccessRightsStickyBar from '../shared/AccessRightsStickyBar';

export default function AccessRightsTemplateEditor({
  businessTypeName = '',
  roleName = '',
  roleCode = '',
  employeesCount = 0,
  exceptionsCount = 0,
  moduleGroups = [],
  moduleToggles = {},
  isDirty = false,
  dirtyCount = 0,
  isSaving = false,
  onToggleModule,
  onEnableGroup,
  onDisableGroup,
  onReset,
  onSave,
  onViewStaff,
  onCopyFromOther,
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'enabled' | 'disabled'
  const [search, setSearch] = useState('');

  const cleanSearch = search.trim().toLowerCase();

  const totalModulesCount = moduleGroups.reduce((acc, g) => acc + (g.modules?.length || 0), 0);
  const enabledModulesCount = moduleGroups.reduce((acc, g) => {
    return acc + (g.modules || []).filter((m) => Boolean(moduleToggles[m.id])).length;
  }, 0);
  const disabledModulesCount = totalModulesCount - enabledModulesCount;

  const filteredGroups = moduleGroups
    .map((group) => {
      const matched = (group.modules || []).filter((m) => {
        const matchesSearch = !cleanSearch || m.name.toLowerCase().includes(cleanSearch);
        const isEnabled = Boolean(moduleToggles[m.id]);
        if (filterMode === 'enabled') return matchesSearch && isEnabled;
        if (filterMode === 'disabled') return matchesSearch && !isEnabled;
        return matchesSearch;
      });
      return { ...group, modules: matched };
    })
    .filter((g) => g.modules.length > 0);

  return (
    <div className="flex-1 min-w-0 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            {businessTypeName} · rol shabloni
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{roleName}</span>
          </h2>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {enabledModulesCount} / {totalModulesCount} modul yoqilgan
            </span>
            <span>·</span>
            <span>{employeesCount} xodim</span>
            <span>·</span>
            <span className={exceptionsCount > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}>
              {exceptionsCount} tasida istisno
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onViewStaff && (
            <BaseButton
              variant="secondary"
              size="sm"
              onClick={onViewStaff}
              className="text-xs font-semibold gap-1.5"
            >
              <Users size={14} className="text-slate-500" />
              <span>Shablondagi xodimlar</span>
            </BaseButton>
          )}
          {onCopyFromOther && (
            <BaseButton
              variant="secondary"
              size="sm"
              onClick={onCopyFromOther}
              className="text-xs font-semibold gap-1.5"
            >
              <Copy size={14} className="text-slate-500" />
              <span>Boshqa shablondan nusxa</span>
            </BaseButton>
          )}
        </div>
      </div>

      {/* Info notice box per PDF */}
      <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/30 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
        <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <span>
          Shablondagi o‘zgarish shu shablondagi barcha xodimlarga qo‘llanadi. Xodimda istisno bo‘lsa, istisno qilingan modul o‘zgarmaydi.
        </span>
      </div>

      {/* Search & Filter chips */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Modul nomi..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'all', label: `Hammasi ${totalModulesCount}` },
            { id: 'enabled', label: `Yoqilgan ${enabledModulesCount}` },
            { id: 'disabled', label: `O‘chirilgan ${disabledModulesCount}` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                filterMode === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion module groups */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
            <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Modul topilmadi
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Qidiruv so‘zini o‘zgartiring yoki filtrni tozalang
            </p>
            {(search || filterMode !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilterMode('all');
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg cursor-pointer"
              >
                Qidiruvni tozalash
              </button>
            )}
          </div>
        ) : (
          filteredGroups.map((group) => (
            <AccessRightsModuleGroupAccordion
              key={group.id}
              group={group}
              moduleToggles={moduleToggles}
              onToggleModule={onToggleModule}
              onEnableAll={() => onEnableGroup(group.id)}
              onDisableAll={() => onDisableGroup(group.id)}
            />
          ))
        )}
      </div>

      {/* Sticky Save Bar */}
      <AccessRightsStickyBar
        isDirty={isDirty}
        dirtyCount={dirtyCount}
        message={`${dirtyCount} ta o‘zgarish saqlanmagan (${roleName} · ${employeesCount} xodimga ta'sir qiladi)`}
        onReset={onReset}
        onSave={onSave}
        isSaving={isSaving}
      />
    </div>
  );
}

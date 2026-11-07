import React, { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AccessRightsTemplateEditorHeader from './AccessRightsTemplateEditorHeader';
import AccessRightsModuleGroupAccordion from './AccessRightsModuleGroupAccordion';
import AccessRightsStickyBar from '../shared/AccessRightsStickyBar';

export default function AccessRightsTemplateEditor({
  businessTypeName = '',
  roleName = '',
  roleCode = '',
  templateSource = 'DEFAULT',
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
  onResetToDefault,
  onSave,
  onViewStaff,
  onCopyFromOther,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const [filterMode, setFilterMode] = useState('all');
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
      <AccessRightsTemplateEditorHeader
        businessTypeName={businessTypeName}
        roleName={roleName}
        templateSource={templateSource}
        isModified={isDirty}
        enabledModulesCount={enabledModulesCount}
        totalModulesCount={totalModulesCount}
        employeesCount={employeesCount}
        exceptionsCount={exceptionsCount}
        isRu={isRu}
        onResetToDefault={onResetToDefault}
        onViewStaff={onViewStaff}
        onCopyFromOther={onCopyFromOther}
      />

      <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/30 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
        <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <span>
          {isRu
            ? 'Изменения в шаблоне применяются ко всем сотрудникам этой роли без индивидуальных исключений.'
            : 'Shablondagi o‘zgarish shu shablondagi barcha xodimlarga qo‘llanadi. Xodimda istisno bo‘lsa, istisno qilingan modul o‘zgarmaydi.'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRu ? 'Название модуля...' : 'Modul nomi...'}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'all', label: isRu ? `Все ${totalModulesCount}` : `Hammasi ${totalModulesCount}` },
            { id: 'enabled', label: isRu ? `Вкл. ${enabledModulesCount}` : `Yoqilgan ${enabledModulesCount}` },
            { id: 'disabled', label: isRu ? `Выкл. ${disabledModulesCount}` : `O‘chirilgan ${disabledModulesCount}` },
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

      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
            <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isRu ? 'Модули не найдены' : 'Modul topilmadi'}
            </h3>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <AccessRightsModuleGroupAccordion
              key={group.id}
              group={group}
              moduleToggles={moduleToggles}
              onToggleModule={onToggleModule}
              onEnableAll={(visibleIds) => onEnableGroup(group.id, visibleIds)}
              onDisableAll={(visibleIds) => onDisableGroup(group.id, visibleIds)}
            />
          ))
        )}
      </div>

      <AccessRightsStickyBar
        isDirty={isDirty}
        dirtyCount={dirtyCount}
        message={
          isRu
            ? `${dirtyCount} несохранённых изменений (${roleName} · затронет ${employeesCount} сотр.)`
            : `${dirtyCount} ta o‘zgarish saqlanmagan (${roleName} · ${employeesCount} xodimga ta'sir qiladi)`
        }
        onReset={onReset}
        onSave={onSave}
        isSaving={isSaving}
        hideWhenClean={true}
      />
    </div>
  );
}

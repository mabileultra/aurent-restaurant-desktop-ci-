import React, { useState } from 'react';
import { Copy, RotateCcw, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../../../components/ui';
import AccessRightsAvatar from '../shared/AccessRightsAvatar';
import AccessRightsStaffModuleItem from './AccessRightsStaffModuleItem';
import AccessRightsStaffDetailKPIs from './AccessRightsStaffDetailKPIs';
import AccessRightsStickyBar from '../shared/AccessRightsStickyBar';
import { resolveRoleLabel, resolveBusinessTypeName } from '../utils/accessRightsCatalogUtils';

export default function AccessRightsStaffDetailPanel({
  user,
  totalUsersCount = 1,
  templateModules = new Set(),
  moduleOverrides = {},
  allModules = [],
  isDirty = false,
  dirtyCount = 0,
  isSaving = false,
  onChangeOverride,
  onResetUserToTemplate,
  onOpenCopyModal,
  onCancel,
  onSave,
}) {
  const [viewMode, setViewMode] = useState('all');
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  if (!user || totalUsersCount === 0) {
    const isNoneFound = totalUsersCount === 0;
    const title = isNoneFound
      ? (isRu ? 'Сотрудники не найдены' : 'Xodimlar topilmadi')
      : (isRu ? 'Выберите сотрудника слева' : 'Chapdan xodimni tanlang');
    const desc = isNoneFound
      ? (isRu ? 'По выбранным фильтрам сотрудники отсутствуют.' : 'Tanlangan filtrlar bo‘yicha xodimlar topilmadi.')
      : (isRu ? 'Выберите сотрудника из списка для настройки прав.' : 'Xodimning individual huquqlarini sozlash uchun ro‘yxatdan tanlang.');

    return (
      <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <Shield className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">{desc}</p>
      </div>
    );
  }

  const templateCount = templateModules.size;
  let addedCount = 0;
  let blockedCount = 0;

  allModules.forEach((m) => {
    const mode = moduleOverrides[m.id] || 'template';
    if (mode === 'grant' && !templateModules.has(m.id)) addedCount += 1;
    if (mode === 'deny' && templateModules.has(m.id)) blockedCount += 1;
  });

  const finalCount = Math.max(0, templateCount + addedCount - blockedCount);
  const totalExceptions = addedCount + blockedCount;

  const visibleModules = allModules.filter((m) => {
    if (viewMode === 'exceptions') {
      return (moduleOverrides[m.id] || 'template') !== 'template';
    }
    return true;
  });

  const handleConfirmReset = () => {
    const confirmMsg = isRu
      ? 'Сбросить все индивидуальные исключения сотрудника к шаблону роли?'
      : 'Ushbu xodimning barcha shaxsiy istisnolarini rol shabloniga qaytarishni tasdiqlaysizmi?';
    if (window.confirm(confirmMsg)) {
      onResetUserToTemplate();
    }
  };

  return (
    <div id="staff-detail-panel" className="flex-1 min-w-0 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <AccessRightsAvatar name={user.fullName || user.username} size="lg" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {user.fullName || user.username}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span>{user.username}</span>
              <span className="mx-1.5">·</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {resolveRoleLabel(user.role, isRu ? 'ru' : 'uz')}
              </span>
              <span className="mx-1.5">·</span>
              <span>{user.companyName || (isRu ? 'Без компании' : 'Kompaniyasiz')}</span>
            </div>
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
              {isRu ? 'Шаблон: ' : 'Shablon: '}{resolveBusinessTypeName(user.businessType || user.businessTypeName, isRu ? 'ru' : 'uz') || (isRu ? 'Стандарт' : 'Standart')} · {resolveRoleLabel(user.role, isRu ? 'ru' : 'uz')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <BaseButton variant="secondary" size="sm" onClick={onOpenCopyModal} className="text-xs font-semibold gap-1.5">
            <Copy size={13} className="text-slate-500" />
            <span>{isRu ? 'Копировать права' : 'Huquqdan nusxa olish'}</span>
          </BaseButton>

          <BaseButton
            variant="secondary"
            size="sm"
            onClick={handleConfirmReset}
            className="text-xs font-semibold gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <RotateCcw size={13} />
            <span>{isRu ? 'Сбросить к шаблону' : 'Shablonga qaytarish'}</span>
          </BaseButton>
        </div>
      </div>

      <AccessRightsStaffDetailKPIs
        templateCount={templateCount}
        addedCount={addedCount}
        blockedCount={blockedCount}
        finalCount={finalCount}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {isRu ? 'Все модули' : 'Barcha modullar'} ({allModules.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('exceptions')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'exceptions'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {isRu ? 'Только исключения' : 'Faqat istisnolar'} ({totalExceptions})
          </button>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          {isRu ? 'Шаблон · Разрешение · Запрет' : 'Shablon · Ruxsat · Taqiq'}
        </span>
      </div>

      <div className="space-y-2">
        {visibleModules.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            {viewMode === 'exceptions'
              ? (isRu ? 'У данного сотрудника нет индивидуальных исключений' : 'Ushbu xodimda hech qanday shaxsiy istisno yo‘q')
              : (isRu ? 'Модули отсутствуют' : 'Modullar mavjud emas')}
          </div>
        ) : (
          visibleModules.map((m) => (
            <AccessRightsStaffModuleItem
              key={m.id}
              module={m}
              inTemplate={templateModules.has(m.id)}
              overrideMode={moduleOverrides[m.id] || 'template'}
              onChangeMode={onChangeOverride}
            />
          ))
        )}
      </div>

      <AccessRightsStickyBar
        isDirty={isDirty}
        dirtyCount={dirtyCount}
        message={
          isRu
            ? `${dirtyCount} несохранённых изменений (${user.fullName || user.username})`
            : `${dirtyCount} ta o‘zgarish saqlanmagan (${user.fullName || user.username})`
        }
        onReset={onCancel}
        onSave={onSave}
        isSaving={isSaving}
        hideWhenClean={true}
      />
    </div>
  );
}

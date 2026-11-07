import React from 'react';
import { useTranslation } from 'react-i18next';
import AccessRightsTriStateButton from '../shared/AccessRightsTriStateButton';

export default function AccessRightsStaffModuleItem({
  module,
  inTemplate = false,
  overrideMode = 'template',
  onChangeMode,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  const effectiveResult = overrideMode === 'grant'
    ? true
    : overrideMode === 'deny'
    ? false
    : inTemplate;

  let statusText = isRu
    ? 'Совпадает с шаблоном — без исключений'
    : 'Shablon bilan bir xil — istisno yo‘q';
  let statusColor = 'text-slate-500 dark:text-slate-400';

  if (overrideMode === 'grant') {
    statusText = inTemplate
      ? (isRu ? 'В шаблоне и подтверждено лично' : 'Shablonda bor va shaxsiy tasdiqlangan')
      : (isRu ? 'Персональное разрешение (+разрешение)' : 'Shaxsiy qo‘shimcha ruxsat berilgan (+ruxsat)');
    statusColor = 'text-emerald-700 dark:text-emerald-400 font-semibold';
  } else if (overrideMode === 'deny') {
    statusText = inTemplate
      ? (isRu ? 'Есть в шаблоне, но запрещено сотруднику (−запрет)' : 'Shablonda bor, lekin bu xodimga taqiqlangan (−taqiq)')
      : (isRu ? 'Персонально запрещено' : 'Shaxsiy taqiqlangan');
    statusColor = 'text-rose-600 dark:text-rose-400 font-semibold';
  }

  const moduleDisplayName = module?.name || module?.id;
  const inTemplateLabel = inTemplate
    ? (isRu ? 'Да' : 'Ha')
    : (isRu ? 'Нет' : 'Yo‘q');
  const resultLabel = effectiveResult
    ? (isRu ? 'Да' : 'Ha')
    : (isRu ? 'Нет' : 'Yo‘q');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
            {moduleDisplayName}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
            {module.groupTitle || (isRu ? 'Основной' : 'Asosiy')}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1">
          <span>
            {isRu ? 'В шаблоне: ' : 'Shablonda: '}
            <strong className="text-slate-800 dark:text-slate-200">{inTemplateLabel}</strong>
          </span>
          <span>·</span>
          <span>
            {isRu ? 'Итог: ' : 'Natija: '}
            <strong className={effectiveResult ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}>
              {resultLabel}
            </strong>
          </span>
          <span>·</span>
          <span className={statusColor}>{statusText}</span>
        </div>
      </div>

      <div className="shrink-0 self-end sm:self-center">
        <AccessRightsTriStateButton
          mode={overrideMode}
          onChange={(newMode) => onChangeMode(module.id, newMode)}
          moduleName={moduleDisplayName}
        />
      </div>
    </div>
  );
}

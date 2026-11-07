import React from 'react';
import { Users, Copy, RotateCcw } from 'lucide-react';
import { BaseButton } from '../../../../../components/ui';

export default function AccessRightsTemplateEditorHeader({
  businessTypeName = '',
  roleName = '',
  templateSource = 'DEFAULT',
  isModified = false,
  enabledModulesCount = 0,
  totalModulesCount = 0,
  employeesCount = 0,
  exceptionsCount = 0,
  isRu = false,
  onResetToDefault,
  onViewStaff,
  onCopyFromOther,
}) {
  const isChangedTemplate = Boolean(isModified);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5 truncate">
          {businessTypeName} · {isRu ? 'шаблон роли' : 'rol shabloni'}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{roleName}</h2>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isChangedTemplate
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {isChangedTemplate
              ? (isRu ? 'Изменённый шаблон' : 'O‘zgartirilgan shablon')
              : (isRu ? 'Стандартный (система)' : 'Standart (tizim)')}
          </span>
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
            {enabledModulesCount} / {totalModulesCount} {isRu ? 'модулей включено' : 'modul yoqilgan'}
          </span>
          <span className="text-slate-400 dark:text-slate-600 font-bold select-none">·</span>
          <span className="whitespace-nowrap">{employeesCount} {isRu ? 'сотрудников' : 'xodim'}</span>
          <span className="text-slate-400 dark:text-slate-600 font-bold select-none">·</span>
          <span className={`whitespace-nowrap ${exceptionsCount > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}`}>
            {exceptionsCount} {isRu ? 'с исключениями' : 'tasida istisno'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {onResetToDefault && isChangedTemplate && (
          <BaseButton
            variant="secondary"
            size="sm"
            onClick={onResetToDefault}
            className="text-xs font-semibold gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <RotateCcw size={13} />
            <span>{isRu ? 'Сбросить к стандарту' : 'Standartga qaytarish'}</span>
          </BaseButton>
        )}
        {onViewStaff && (
          <BaseButton variant="secondary" size="sm" onClick={onViewStaff} className="text-xs font-semibold gap-1.5">
            <Users size={14} className="text-slate-500" />
            <span>{isRu ? 'Сотрудники шаблона' : 'Shablondagi xodimlar'}</span>
          </BaseButton>
        )}
        {onCopyFromOther && (
          <BaseButton variant="secondary" size="sm" onClick={onCopyFromOther} className="text-xs font-semibold gap-1.5">
            <Copy size={14} className="text-slate-500" />
            <span>{isRu ? 'Копия из другого шаблона' : 'Boshqa shablondan nusxa'}</span>
          </BaseButton>
        )}
      </div>
    </div>
  );
}

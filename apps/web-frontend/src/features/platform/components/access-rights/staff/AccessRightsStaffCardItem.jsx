import React from 'react';
import { useTranslation } from 'react-i18next';
import AccessRightsAvatar from '../shared/AccessRightsAvatar';
import { resolveRoleLabel, resolveBusinessTypeName } from '../utils/accessRightsCatalogUtils';

export default function AccessRightsStaffCardItem({
  user,
  isSelected = false,
  isChecked = false,
  onSelect,
  onCheck,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const hasExactCount = typeof user.exceptionCount === 'number';
  const hasCustom = Boolean(user.moduleAccessCustom || (hasExactCount && user.exceptionCount > 0));
  const isTemplate = !hasCustom;

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center justify-between p-3 rounded-xl border text-xs transition-all cursor-pointer ${
        isSelected
          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs'
          : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <input
          type="checkbox"
          checked={isChecked}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onCheck(e.target.checked);
          }}
          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer shrink-0"
        />

        <AccessRightsAvatar name={user.fullName || user.username} size="md" />

        <div className="min-w-0">
          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
            {user.fullName || user.username}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
            <span>{user.username}</span>
            <span className="mx-1">·</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {resolveRoleLabel(user.role, isRu ? 'ru' : 'uz')}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            <span>{user.companyName || (isRu ? 'Без компании' : 'Kompaniyasiz')}</span>
            {(user.businessType || user.businessTypeName) && (
              <>
                <span className="mx-1">·</span>
                <span>{resolveBusinessTypeName(user.businessType || user.businessTypeName, isRu ? 'ru' : 'uz')}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 pl-2">
        {isTemplate ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {isRu ? 'Шаблон' : 'Shablon'}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {hasExactCount
              ? `${user.exceptionCount} ${isRu ? 'искл.' : 'istisno'}`
              : (isRu ? 'Исключения' : 'Istisnoli')}
          </span>
        )}
      </div>
    </div>
  );
}

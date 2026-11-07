import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatedCheckbox19 } from '../../../../../components/ui';
import { resolveRoleLabel } from '../utils/accessRightsCatalogUtils';

export default function AccessRightsCopyCandidateItem({
  user,
  isChecked = false,
  isSameRole = false,
  sourceRole = '',
  onToggle,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const uid = user.userId || user.id;

  const roleLabel = resolveRoleLabel(user.role, isRu ? 'ru' : 'uz');
  const sourceRoleLabel = resolveRoleLabel(sourceRole, isRu ? 'ru' : 'uz');

  return (
    <label
      className={`flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
        isSameRole ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <AnimatedCheckbox19
          checked={isChecked}
          disabled={!isSameRole}
          onChange={() => isSameRole && onToggle(uid)}
          size={18}
          ariaLabel={`${user.fullName || user.username}ni tanlash`}
        />
        <div className="min-w-0 truncate">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
            {user.fullName || user.username}
          </span>
          <span className="text-slate-500 ml-1.5 text-xs">
            ({roleLabel})
          </span>
        </div>
      </div>

      {!isSameRole && (
        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium shrink-0 ml-2">
          <AlertTriangle size={12} />
          <span>
            {isRu
              ? `Другая роль (нужна: ${sourceRoleLabel})`
              : `Rol mos emas (${sourceRoleLabel} talab qilinadi)`}
          </span>
        </span>
      )}
    </label>
  );
}

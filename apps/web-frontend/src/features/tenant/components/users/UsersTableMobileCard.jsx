import React from 'react';
import { MapPin } from 'lucide-react';
import { BaseCheckbox } from '../../../../components/ui';
import TableRowActionsMenu from '../../../../components/shared/TableRowActionsMenu';
import { USER_ROLE_BADGE } from '../../constants';
import { sanitizeUserDisplayName } from '../../utils/userFormValidationUtils';
import { buildUserActions } from '../../utils/userActionsHelper';

/**
 * UsersTableMobileCard
 * Mobile card component for displaying user in responsive list (< sm).
 */
export default function UsersTableMobileCard({
  user,
  isSelected,
  company,
  actorRole,
  currentUserId,
  currentUsername,
  menuOpen,
  onMenuOpenChange,
  onRowClick,
  onToggleSelect,
  onEdit,
  onToggleActive,
  onDelete,
  t,
  regionName,
  districtName,
}) {
  const displayName = sanitizeUserDisplayName(user.fullName, user.username);
  const compName = user.companyName || company?.name;
  const loginCode = user.companyLoginCode || company?.loginCode;
  const isPlatformStaff = user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_ADMIN';

  const isSelf =
    (currentUserId && String(user.id) === String(currentUserId)) ||
    (currentUsername && user.username && user.username.toLowerCase() === currentUsername.toLowerCase());

  const rCode = user.regionCode || company?.regionCode;
  const dCode = user.districtCode || company?.districtCode;
  const userRegion = rCode ? regionName(rCode) : '';
  const userDistrict = dCode ? districtName(dCode) : '';
  const isPlaceholder = (val) => !val || val === 'Yo‘q' || val === 'Yo\'q' || val === 'Нет';
  const validRegion = isPlaceholder(userRegion) ? '' : userRegion;
  const validDistrict = isPlaceholder(userDistrict) ? '' : userDistrict;
  const userLocation = [validRegion, validDistrict].filter(Boolean).join(' · ');

  const actions = buildUserActions({ user, isSelf, actorRole, onEdit, onToggleActive, onDelete, t });

  return (
    <div
      id={`user-card-${user.id}`}
      onClick={() => onRowClick?.(user)}
      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0" onClick={(e) => e.stopPropagation()}>
          <div className="mt-0.5">
            <BaseCheckbox
              checked={isSelected}
              onChange={() => onToggleSelect?.(user.id)}
              ariaLabel={t('users.selectUser', { name: displayName, defaultValue: 'Foydalanuvchini tanlash' })}
              size={18}
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white truncate text-sm">{displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
              {user.username} {user.phone ? `· ${user.phone}` : ''}
            </p>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <TableRowActionsMenu
            open={menuOpen}
            onOpenChange={onMenuOpenChange}
            actions={actions}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ${USER_ROLE_BADGE[user.role] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
          {t(`roles.${user.role}`, user.role)}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${user.active ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {user.active ? t('users.activeStatus', { defaultValue: 'Faol' }) : t('users.inactiveStatus', { defaultValue: 'Nofaol' })}
        </span>
        {isPlatformStaff ? (
          <span className="text-purple-600 dark:text-purple-400 font-medium">
            {t('users.platformAdminTitle', { defaultValue: 'Platforma administratori' })}
          </span>
        ) : (
          <span
            className={`text-xs font-medium truncate max-w-[140px] ${compName ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500 italic'}`}
            title={compName || t('users.orphanCompany', { defaultValue: 'Kompaniyasiz (o‘chirilgan)' })}
          >
            {compName || t('users.orphanCompany', { defaultValue: 'Kompaniyasiz (o‘chirilgan)' })}
          </span>
        )}
        {!isPlatformStaff && loginCode ? (
          <span className="font-mono text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200/60 dark:border-purple-800 shrink-0">
            #{loginCode}
          </span>
        ) : null}
        {!isPlatformStaff && userLocation ? (
          <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[11px] truncate max-w-full">
            <MapPin size={11} className="shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate">{userLocation}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

import React from 'react';
import { KeyRound } from 'lucide-react';
import { BaseCheckbox } from '../../../../components/ui';
import TableRowActionsMenu from '../../../../components/shared/TableRowActionsMenu';
import { USER_ROLE_BADGE } from '../../constants';
import { sanitizeUserDisplayName } from '../../utils/userFormValidationUtils';
import { buildUserActions } from '../../utils/userActionsHelper';

/**
 * UsersTableRow
 * Single desktop table row for a user.
 */
export default function UsersTableRow({
  user,
  isSelected,
  isPlatform,
  actorRole,
  currentUserId,
  currentUsername,
  company,
  menuOpen,
  onMenuOpenChange,
  onRowClick,
  onToggleSelect,
  onEdit,
  onToggleActive,
  onDelete,
  t,
  businessTypeLabel,
}) {
  const loginCode = user.companyLoginCode || company?.loginCode;
  const displayName = sanitizeUserDisplayName(user.fullName, user.username);
  const isPlatformStaff = user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_ADMIN';
  const isSelf = (currentUserId && String(user.id) === String(currentUserId)) ||
    (currentUsername && user.username && user.username.toLowerCase() === currentUsername.toLowerCase());

  const isPin = user.role === 'CASHIER' || user.role === 'COOK' || user.role === 'WAITER';
  const securityTooltip = isPin
    ? (user.role === 'COOK' ? 'Oshpaz PIN-kodi' : user.role === 'WAITER' ? 'Ofitsiant PIN-kodi' : t('users.credentialsPinHidden', { defaultValue: 'PIN yashirilgan' }))
    : t('users.credentialsPasswordHidden', { defaultValue: 'Parol yashirilgan' });

  const actions = buildUserActions({ user, isSelf, actorRole, onEdit, onToggleActive, onDelete, t });

  return (
    <tr
      id={`user-row-${user.id}`}
      tabIndex={0}
      onClick={() => onRowClick?.(user)}
      onKeyDown={(e) => { if (e.key === 'Enter') onRowClick?.(user); }}
      className={`group cursor-pointer transition-colors ${
        isSelected
          ? 'bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/30'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
      }`}
    >
      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
        <BaseCheckbox
          checked={isSelected}
          onChange={() => onToggleSelect?.(user.id)}
          ariaLabel={t('users.selectUser', { name: displayName, defaultValue: 'Foydalanuvchini tanlash' })}
          size={18}
        />
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-slate-900 dark:text-white truncate">{displayName}</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{user.username}</span>
            {user.phone ? (
              <><span className="text-slate-300 dark:text-slate-600">·</span><span className="font-mono text-[11px]">{user.phone}</span></>
            ) : user.email ? (
              <><span className="text-slate-300 dark:text-slate-600">·</span><span className="truncate max-w-[140px]">{user.email}</span></>
            ) : null}
          </div>
          <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500" title={securityTooltip}>
            <KeyRound size={11} className="text-slate-400 shrink-0" /><span className="truncate">{securityTooltip}</span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${USER_ROLE_BADGE[user.role] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
          {t(`roles.${user.role}`, user.role)}
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col min-w-0">
          {isPlatform && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-slate-900 dark:text-white truncate">
                {isPlatformStaff ? t('users.platformAdminScope', { defaultValue: 'Platforma' }) : (user.companyName || company?.name || t('users.orphanCompany', { defaultValue: 'Kompaniyasiz (o‘chirilgan)' }))}
              </span>
              {!isPlatformStaff && loginCode ? (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-700" title={`#${loginCode}`}>
                  #{loginCode}
                </span>
              ) : null}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isPlatformStaff ? (
              <span className="text-purple-600 dark:text-purple-400 font-medium">{t('users.platformAdminTitle', { defaultValue: 'Platforma administratori' })}</span>
            ) : (
              <>
                <span className="truncate">{user.storeNames?.length ? user.storeNames.join(', ') : t('users.noStoresAvailable', { defaultValue: 'Filialsiz' })}</span>
                {isPlatform && (<><span className="text-slate-300 dark:text-slate-600">·</span><span className="text-[11px] text-slate-400">{businessTypeLabel(user)}</span></>)}
              </>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {user.active ? t('users.activeStatus', { defaultValue: 'Faol' }) : t('users.inactiveStatus', { defaultValue: 'Nofaol' })}
        </span>
      </td>

      <td className="admin-table-sticky-end px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <TableRowActionsMenu open={menuOpen} onOpenChange={onMenuOpenChange} actions={actions} />
      </td>
    </tr>
  );
}

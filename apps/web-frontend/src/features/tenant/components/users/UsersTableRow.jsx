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
          ? 'bg-aa-surface-selected hover:bg-aa-surface-selected'
          : 'hover:bg-aa-surface-hover'
      }`}
    >
      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
        <BaseCheckbox
          variant="aa"
          checked={isSelected}
          onChange={() => onToggleSelect?.(user.id)}
          ariaLabel={t('users.selectUser', { name: displayName, defaultValue: 'Foydalanuvchini tanlash' })}
          size={18}
        />
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-aa-ink truncate">{displayName}</span>
          <div className="flex items-center gap-1.5 text-xs text-aa-ink-muted mt-0.5 truncate">
            <span className="font-mono text-aa-ink font-medium">{user.username}</span>
            {user.phone ? (
              <><span className="text-aa-ink-subtle">·</span><span className="font-mono text-xs">{user.phone}</span></>
            ) : user.email ? (
              <><span className="text-aa-ink-subtle">·</span><span className="truncate max-w-36">{user.email}</span></>
            ) : null}
          </div>
          <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-aa-ink-subtle" title={securityTooltip}>
            <KeyRound size={12} className="text-aa-ink-subtle shrink-0" /><span className="truncate">{securityTooltip}</span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-aa-sm px-2 py-0.5 text-xs font-semibold bg-aa-surface-sunken text-aa-ink-muted border border-aa-line">
          {t(`roles.${user.role}`, user.role)}
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col min-w-0">
          {isPlatform && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-aa-ink truncate">
                {isPlatformStaff ? t('users.platformAdminScope', { defaultValue: 'Platforma' }) : (user.companyName || company?.name || t('users.orphanCompany', { defaultValue: 'Kompaniyasiz (o‘chirilgan)' }))}
              </span>
              {!isPlatformStaff && loginCode ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-aa-sm text-xs font-mono font-medium bg-aa-surface-sunken text-aa-ink-muted border border-aa-line" title={`#${loginCode}`}>
                  #{loginCode}
                </span>
              ) : null}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-aa-ink-muted mt-0.5">
            {isPlatformStaff ? (
              <span className="text-aa-brand font-medium">{t('users.platformAdminTitle', { defaultValue: 'Platforma administratori' })}</span>
            ) : (
              <>
                <span className="truncate">{user.storeNames?.length ? user.storeNames.join(', ') : t('users.noStoresAvailable', { defaultValue: 'Filialsiz' })}</span>
                {isPlatform && (<><span className="text-aa-ink-subtle">·</span><span className="text-xs text-aa-ink-muted">{businessTypeLabel(user)}</span></>)}
              </>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${
          user.active
            ? 'bg-aa-success-soft text-aa-success border-aa-line'
            : 'bg-aa-surface-sunken text-aa-ink-muted border-aa-line'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-aa-success' : 'bg-aa-ink-subtle'}`} />
          {user.active ? t('users.activeStatus', { defaultValue: 'Faol' }) : t('users.inactiveStatus', { defaultValue: 'Nofaol' })}
        </span>
      </td>

      <td className="admin-table-sticky-end px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <TableRowActionsMenu variant="aa" open={menuOpen} onOpenChange={onMenuOpenChange} actions={actions} />
      </td>
    </tr>
  );
}

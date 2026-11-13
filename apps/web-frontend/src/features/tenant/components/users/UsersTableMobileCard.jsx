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
      className={`p-3.5 rounded-aa-lg border transition-all cursor-pointer ${
        isSelected
          ? 'border-aa-brand bg-aa-surface-selected'
          : 'border-aa-line bg-aa-surface hover:border-aa-line-strong'
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
            <p className="font-semibold text-aa-ink truncate text-sm">{displayName}</p>
            <p className="text-xs text-aa-ink-muted font-mono mt-0.5 truncate">
              {user.username} {user.phone ? `· ${user.phone}` : ''}
            </p>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <TableRowActionsMenu
            variant="aa"
            open={menuOpen}
            onOpenChange={onMenuOpenChange}
            actions={actions}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center rounded-aa-sm px-2 py-0.5 text-xs font-semibold bg-aa-surface-sunken text-aa-ink-muted border border-aa-line">
          {t(`roles.${user.role}`, user.role)}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${
          user.active
            ? 'bg-aa-success-soft text-aa-success border-aa-line'
            : 'bg-aa-surface-sunken text-aa-ink-muted border-aa-line'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-aa-success' : 'bg-aa-ink-subtle'}`} />
          {user.active ? t('users.activeStatus', { defaultValue: 'Faol' }) : t('users.inactiveStatus', { defaultValue: 'Nofaol' })}
        </span>
        {isPlatformStaff ? (
          <span className="text-aa-brand font-medium">
            {t('users.platformAdminTitle', { defaultValue: 'Platforma administratori' })}
          </span>
        ) : (
          <span
            className={`text-xs font-medium truncate max-w-36 ${compName ? 'text-aa-ink' : 'text-aa-ink-subtle italic'}`}
            title={compName || t('users.orphanCompany', { defaultValue: 'Kompaniyasiz (o‘chirilgan)' })}
          >
            {compName || t('users.orphanCompany', { defaultValue: 'Kompaniyasiz (o‘chirilgan)' })}
          </span>
        )}
        {!isPlatformStaff && loginCode ? (
          <span className="font-mono text-xs font-medium text-aa-ink-muted bg-aa-surface-sunken px-1.5 py-0.5 rounded-aa-sm border border-aa-line shrink-0">
            #{loginCode}
          </span>
        ) : null}
        {!isPlatformStaff && userLocation ? (
          <span className="inline-flex items-center gap-1 text-aa-ink-subtle text-xs truncate max-w-full">
            <MapPin size={12} className="shrink-0 text-aa-ink-subtle" aria-hidden="true" />
            <span className="truncate">{userLocation}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

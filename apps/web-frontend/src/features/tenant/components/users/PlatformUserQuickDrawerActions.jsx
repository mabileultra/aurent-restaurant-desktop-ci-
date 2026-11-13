import React from 'react';
import { KeyRound, Pencil, Power, Trash2 } from 'lucide-react';
import { canDeleteUser } from '../../utils/userDeletePolicy';

/**
 * PlatformUserQuickDrawerActions
 * Footer action buttons for PlatformUserQuickDrawer.
 * Blocks self-deactivation and safely excludes unimplemented session termination.
 */
export default function PlatformUserQuickDrawerActions({
  user,
  actorRole,
  isSelf,
  t,
  onClose,
  onEdit,
  onToggleActive,
  onDelete,
}) {
  const isDeactivating = Boolean(user.active);
  const selfDeactivateBlocked = isDeactivating && isSelf;

  const handleEditClick = () => {
    onClose();
    onEdit?.(user);
  };

  const handleResetCredsClick = () => {
    onClose();
    onEdit?.(user, { resetPasswordMode: true });
  };

  const handleToggleClick = () => {
    if (selfDeactivateBlocked) return;
    onToggleActive?.(user);
  };

  const handleDeleteClick = () => {
    onClose();
    onDelete?.(user);
  };

  return (
    <div className="p-5 border-t border-aa-line bg-aa-surface-sunken flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleEditClick}
          className="aa-btn aa-btn--secondary aa-size-md inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <Pencil size={15} />
          {t('common.edit', { defaultValue: 'Tahrirlash' })}
        </button>

        <button
          type="button"
          disabled={selfDeactivateBlocked}
          onClick={handleToggleClick}
          title={selfDeactivateBlocked ? t('users.selfDeactivateBlockedTitle', { defaultValue: 'O‘z hisobingizni faolsizlantira olmaysiz' }) : undefined}
          className={`aa-size-md inline-flex items-center justify-center gap-2 font-medium transition-colors ${
            selfDeactivateBlocked
              ? 'opacity-50 cursor-not-allowed aa-btn aa-btn--secondary'
              : user.active
              ? 'aa-btn aa-btn--secondary cursor-pointer text-aa-warning'
              : 'aa-btn aa-btn--primary cursor-pointer'
          }`}
        >
          <Power size={15} />
          {user.active
            ? t('users.deactivate', { defaultValue: 'Faolsizlantirish' })
            : t('users.activate', { defaultValue: 'Faollashtirish' })}
        </button>
      </div>

      <button
        type="button"
        onClick={handleResetCredsClick}
        className="aa-btn aa-btn--secondary aa-size-md inline-flex items-center justify-center gap-2 cursor-pointer"
      >
        <KeyRound size={14} />
        {t('users.resetPasswordOrPin', { defaultValue: 'Parol / PIN tiklash' })}
      </button>

      {canDeleteUser(actorRole, user.role) && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="aa-btn aa-btn--danger aa-size-md inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <Trash2 size={14} />
          {t('common.delete', { defaultValue: 'O‘chirish' })}
        </button>
      )}
    </div>
  );
}

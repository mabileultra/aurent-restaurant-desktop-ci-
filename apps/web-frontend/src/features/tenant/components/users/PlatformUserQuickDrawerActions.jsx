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
    <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleEditClick}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Pencil size={15} />
          {t('common.edit', { defaultValue: 'Tahrirlash' })}
        </button>

        <button
          type="button"
          disabled={selfDeactivateBlocked}
          onClick={handleToggleClick}
          title={selfDeactivateBlocked ? t('users.selfDeactivateBlockedTitle', { defaultValue: 'O‘z hisobingizni faolsizlantira olmaysiz' }) : undefined}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            selfDeactivateBlocked
              ? 'opacity-50 cursor-not-allowed border border-slate-200 text-slate-400 dark:border-slate-700'
              : user.active
              ? 'border border-amber-300 text-amber-700 dark:border-amber-700/80 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
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
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <KeyRound size={14} />
        {t('users.resetPasswordOrPin', { defaultValue: 'Parol / PIN tiklash' })}
      </button>

      {canDeleteUser(actorRole, user.role) && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
        >
          <Trash2 size={14} />
          {t('common.delete', { defaultValue: 'O‘chirish' })}
        </button>
      )}
    </div>
  );
}

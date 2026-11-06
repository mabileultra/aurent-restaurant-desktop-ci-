import toast from 'react-hot-toast';
import { canDeleteUser } from './userDeletePolicy';

/**
 * userActionsHelper.js
 * Single source of truth for user table actions (Desktop table row and Mobile card).
 */
export function buildUserActions({
  user,
  isSelf,
  actorRole,
  onEdit,
  onToggleActive,
  onDelete,
  t,
}) {
  return [
    {
      label: t('common.edit', { defaultValue: 'Tahrirlash' }),
      onClick: () => onEdit(user),
    },
    {
      label: user.active
        ? t('users.deactivate', { defaultValue: 'Faolsizlantirish' })
        : t('users.activate', { defaultValue: 'Faollashtirish' }),
      onClick: () => onToggleActive(user),
      disabled: isSelf && user.active,
      disabledReason: isSelf && user.active
        ? t('users.selfDeactivateBlockedTitle', { defaultValue: 'O‘z hisobingizni faolsizlantira olmaysiz' })
        : undefined,
    },
    {
      label: t('users.resetPasswordOrPin', { defaultValue: 'Parol / PIN tiklash' }),
      onClick: () => onEdit(user, { resetPasswordMode: true }),
    },
    {
      label: t('users.copyUuid', { defaultValue: 'ID nusxalash' }),
      onClick: () => {
        if (user.id) {
          navigator.clipboard.writeText(String(user.id));
          toast.success(t('users.uuidCopied', { defaultValue: 'Foydalanuvchi ID nusxalandi' }));
        }
      },
    },
    {
      label: t('common.delete', { defaultValue: 'O‘chirish' }),
      onClick: () => onDelete(user),
      danger: true,
      disabled: !canDeleteUser(actorRole, user.role),
      disabledReason: !canDeleteUser(actorRole, user.role)
        ? (user.active
          ? t('users.deleteRestrictedActive', { defaultValue: 'Bu rolni o‘chirib bo‘lmaydi — faolsizlantiring' })
          : t('users.deleteRestrictedInactive', { defaultValue: 'Ushbu roldagi foydalanuvchini butunlay o‘chirib bo‘lmaydi' }))
        : undefined,
    },
  ];
}

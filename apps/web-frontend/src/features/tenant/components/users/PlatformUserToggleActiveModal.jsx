import React from 'react';
import { AlertTriangle, Power } from 'lucide-react';
import BaseModal from '../../../../components/ui/BaseModal';
import BaseButton from '../../../../components/ui/BaseButton';
import { sanitizeUserDisplayName } from '../../utils/userFormValidationUtils';

/**
 * PlatformUserToggleActiveModal
 * Confirmation modal for activating or deactivating a platform/tenant user.
 * Prevents self-deactivation by the currently logged-in administrator.
 */
export default function PlatformUserToggleActiveModal({
  user,
  currentUserId,
  currentUsername,
  t,
  isPending,
  onClose,
  onConfirm,
}) {
  if (!user) return null;

  const isDeactivating = Boolean(user.active);
  const isSelf =
    (currentUserId && String(user.id) === String(currentUserId)) ||
    (currentUsername && user.username && user.username.toLowerCase() === currentUsername.toLowerCase());

  const displayName = sanitizeUserDisplayName(user.fullName, user.username);

  const title = isDeactivating
    ? t('users.deactivateTitle', { defaultValue: 'Foydalanuvchini faolsizlantirish' })
    : t('users.activateTitle', { defaultValue: 'Foydalanuvchini faollashtirish' });

  const confirmLabel = isDeactivating
    ? (isPending ? t('common.saving', { defaultValue: 'Saqlanmoqda...' }) : t('users.deactivateConfirm', { defaultValue: 'Faolsizlantirish' }))
    : (isPending ? t('common.saving', { defaultValue: 'Saqlanmoqda...' }) : t('users.activateConfirm', { defaultValue: 'Faollashtirish' }));

  const footer = (
    <div className="flex justify-end gap-2 w-full">
      <BaseButton
        variant="secondary"
        size="md"
        onClick={onClose}
        disabled={isPending}
        data-autofocus
        className="aa-btn aa-btn--secondary aa-size-md"
      >
        {t('common.cancel', { defaultValue: 'Bekor qilish' })}
      </BaseButton>
      <BaseButton
        variant={isDeactivating ? 'danger' : 'primary'}
        size="md"
        disabled={isPending || (isDeactivating && isSelf)}
        onClick={() => onConfirm?.(user)}
        className={`aa-size-md cursor-pointer ${isDeactivating ? 'aa-btn--danger' : 'aa-btn--primary'}`}
      >
        {confirmLabel}
      </BaseButton>
    </div>
  );

  return (
    <BaseModal
      open={Boolean(user)}
      title={title}
      onClose={onClose}
      size="sm"
      className="users-toggle-modal rounded-aa-lg border-aa-line bg-aa-surface shadow-aa-modal"
      footer={footer}
    >
      <div className="space-y-3 text-sm text-aa-ink">
        {isDeactivating && isSelf ? (
          <div className="flex items-start gap-2.5 p-3 rounded-aa-md bg-aa-warning-soft border border-aa-warning/30 text-aa-ink">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-aa-warning" aria-hidden />
            <div>
              <p className="font-semibold">
                {t('users.selfDeactivateBlockedTitle', { defaultValue: 'O‘z hisobingizni faolsizlantira olmaysiz' })}
              </p>
              <p className="mt-1 text-xs text-aa-ink-muted">
                {t('users.selfDeactivateBlockedDesc', {
                  defaultValue: 'Platformaga kirish imkoniyatingiz saqlanishi uchun joriy hisobingizni nofaol qilish taqiqlangan.',
                })}
              </p>
            </div>
          </div>
        ) : isDeactivating ? (
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-aa-md bg-aa-danger-soft text-aa-danger shrink-0">
              <Power size={18} aria-hidden />
            </div>
            <div>
              <p>
                {t('users.deactivateHint', {
                  name: displayName,
                  defaultValue: `Haqiqatan ham «${displayName}» foydalanuvchisini faolsizlantirmoqchimisiz?`,
                })}
              </p>
              <p className="mt-1 text-xs text-aa-ink-muted">
                {t('users.deactivateWarning', {
                  defaultValue: 'Ushbu xodim tizimga kira olmay qoladi. Istalgan vaqtda qayta faollashtirish mumkin.',
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-aa-md bg-aa-success-soft text-aa-success shrink-0">
              <Power size={18} aria-hidden />
            </div>
            <div>
              <p>
                {t('users.activateHint', {
                  name: displayName,
                  defaultValue: `«${displayName}» foydalanuvchisini faollashtirmoqchimisiz?`,
                })}
              </p>
              <p className="mt-1 text-xs text-aa-ink-muted">
                {t('users.activateSuccessHint', {
                  defaultValue: 'Xodim yana tizimga kirish va amallarni bajarish imkoniyatiga ega bo‘ladi.',
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

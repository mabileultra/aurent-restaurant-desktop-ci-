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
        variant="outline"
        size="md"
        onClick={onClose}
        disabled={isPending}
        data-autofocus
      >
        {t('common.cancel', { defaultValue: 'Bekor qilish' })}
      </BaseButton>
      <BaseButton
        variant={isDeactivating ? 'danger' : 'primary'}
        size="md"
        disabled={isPending || (isDeactivating && isSelf)}
        onClick={() => onConfirm?.(user)}
        className={
          isDeactivating
            ? 'bg-rose-600 hover:bg-rose-700 text-white font-semibold'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
        }
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
      footer={footer}
    >
      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
        {isDeactivating && isSelf ? (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" aria-hidden />
            <div>
              <p className="font-semibold">
                {t('users.selfDeactivateBlockedTitle', { defaultValue: 'O‘z hisobingizni faolsizlantira olmaysiz' })}
              </p>
              <p className="mt-1 text-xs">
                {t('users.selfDeactivateBlockedDesc', {
                  defaultValue: 'Platformaga kirish imkoniyatingiz saqlanishi uchun joriy hisobingizni nofaol qilish taqiqlangan.',
                })}
              </p>
            </div>
          </div>
        ) : isDeactivating ? (
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 shrink-0">
              <Power size={18} aria-hidden />
            </div>
            <div>
              <p>
                {t('users.deactivateHint', {
                  name: displayName,
                  defaultValue: `Haqiqatan ham «${displayName}» foydalanuvchisini faolsizlantirmoqchimisiz?`,
                })}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t('users.deactivateWarning', {
                  defaultValue: 'Ushbu xodim tizimga kira olmay qoladi. Istalgan vaqtda qayta faollashtirish mumkin.',
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shrink-0">
              <Power size={18} aria-hidden />
            </div>
            <div>
              <p>
                {t('users.activateHint', {
                  name: displayName,
                  defaultValue: `«${displayName}» foydalanuvchisini faollashtirmoqchimisiz?`,
                })}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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

import React from 'react';
import BaseModal from '../../../../components/ui/BaseModal';
import BaseButton from '../../../../components/ui/BaseButton';
import { sanitizeUserDisplayName } from '../../utils/userFormValidationUtils';

/**
 * UserDeleteConfirmModal
 * Accessible confirmation modal for deleting a tenant user.
 */
export default function UserDeleteConfirmModal({ user, t, isPending, onClose, onConfirm }) {
  if (!user) return null;

  const displayName = sanitizeUserDisplayName(user.fullName, user.username);

  const footer = (
    <div className="flex justify-end gap-2 w-full">
      <BaseButton
        variant="outline"
        size="md"
        onClick={onClose}
        disabled={isPending}
        data-autofocus
      >
        {t('common.cancel')}
      </BaseButton>
      <BaseButton
        variant="danger"
        size="md"
        disabled={isPending}
        onClick={onConfirm}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold"
      >
        {isPending ? t('common.saving', { defaultValue: 'O‘chirilmoqda...' }) : t('common.delete')}
      </BaseButton>
    </div>
  );

  return (
    <BaseModal
      open={Boolean(user)}
      title={t('users.deleteTitle')}
      onClose={onClose}
      size="sm"
      footer={footer}
    >
      <div className="text-sm text-slate-700 dark:text-slate-200">
        {t('users.deleteHint', { name: displayName })}
      </div>
    </BaseModal>
  );
}

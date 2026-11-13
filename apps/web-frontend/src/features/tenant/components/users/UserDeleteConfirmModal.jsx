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
        variant="secondary"
        size="md"
        onClick={onClose}
        disabled={isPending}
        data-autofocus
        className="aa-btn aa-btn--secondary aa-size-md"
      >
        {t('common.cancel')}
      </BaseButton>
      <BaseButton
        variant="danger"
        size="md"
        disabled={isPending}
        onClick={onConfirm}
        className="aa-btn aa-btn--danger aa-size-md cursor-pointer"
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
      className="users-delete-modal rounded-aa-lg border-aa-line bg-aa-surface shadow-aa-modal"
      footer={footer}
    >
      <div className="text-sm text-aa-ink">
        {t('users.deleteHint', { name: displayName })}
      </div>
    </BaseModal>
  );
}

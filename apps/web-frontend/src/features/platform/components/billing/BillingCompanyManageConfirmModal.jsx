import React from 'react';
import { BaseModal } from '../../../../components/ui';

export default function BillingCompanyManageConfirmModal({
  isOpen,
  type,
  companyName,
  formattedAmount,
  currency,
  onConfirm,
  onClose,
  busy = false,
  t,
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const isBusy = busy || submitting;

  if (!isOpen) return null;

  const isDebit = type === 'debit';
  const isCredit = type === 'credit';
  const isBlock = type === 'block';

  let title = t('platform.billing.confirmActionTitle', { defaultValue: 'Amalni tasdiqlash' });
  let message = '';
  let confirmBtnClass = 'bc-btn bc-btn--primary';
  let confirmBtnText = t('common.confirm', { defaultValue: 'Tasdiqlash' });

  if (isDebit) {
    title = t('platform.billing.debitTitle', { defaultValue: 'Mablag‘ yechib olish' });
    message = t('platform.billing.confirmDebitFormatted', {
      defaultValue: '{{name}} kompaniyasidan {{amount}} {{currency}} yechib olinadi. Tasdiqlaysizmi?',
      name: companyName,
      amount: formattedAmount,
      currency,
    });
    confirmBtnClass = 'bc-btn bc-btn--danger';
    confirmBtnText = t('platform.billing.debit', { defaultValue: 'Yechib olish' });
  } else if (isCredit) {
    title = t('platform.billing.creditTitle', { defaultValue: 'Hisobni to‘ldirish' });
    message = t('platform.billing.confirmCreditFormatted', {
      defaultValue: '{{name}} kompaniyasi hisobiga {{amount}} {{currency}} qo‘shiladi. Tasdiqlaysizmi?',
      name: companyName,
      amount: formattedAmount,
      currency,
    });
    confirmBtnClass = 'bc-btn bc-btn--ok';
    confirmBtnText = t('platform.billing.credit', { defaultValue: 'To‘ldirish' });
  } else if (isBlock) {
    title = t('platform.billing.blockTitle', { defaultValue: 'Kompaniyani bloklash' });
    message = t('platform.billing.confirmBlockFormatted', {
      defaultValue: '{{name}} kompaniyasini bloklamoqchimisiz? Bloklangan kompaniya kassa va xizmatlardan foydalana olmaydi.',
      name: companyName,
    });
    confirmBtnClass = 'bc-btn bc-btn--danger';
    confirmBtnText = t('platform.billing.block', { defaultValue: 'Bloklash' });
  }

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await onConfirm();
      onClose();
    } catch {
      // Error handled by mutation toast; keep modal open so user is not surprised
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      title={title}
      onClose={isBusy ? () => {} : onClose}
      size="sm"
      footer={(
        <div className="flex justify-end gap-2">
          <button type="button" className="bc-btn bc-btn--outline" onClick={onClose} disabled={isBusy}>
            {t('common.cancel', { defaultValue: 'Bekor qilish' })}
          </button>
          <button
            type="button"
            className={confirmBtnClass}
            disabled={isBusy}
            onClick={handleConfirm}
          >
            {isBusy ? t('common.loading', { defaultValue: 'Yuklanmoqda…' }) : confirmBtnText}
          </button>
        </div>
      )}
    >
      <div className="py-2 text-sm text-slate-700 dark:text-slate-300">
        <p className="leading-relaxed">{message}</p>
      </div>
    </BaseModal>
  );
}

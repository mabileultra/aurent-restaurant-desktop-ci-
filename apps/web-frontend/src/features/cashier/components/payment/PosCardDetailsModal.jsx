import { useEffect, useState } from 'react';
import BaseModal from '../../../../components/ui/BaseModal';
import BaseButton from '../../../../components/ui/BaseButton';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';
import { cardTypeLabel } from '../../../../utils/salePaymentLabel';
import CardPaymentFields, {
  createInitialCardDetails,
  validateAndNormalizeCardDetails,
} from './CardPaymentFields';

/**
 * Модальное окно ввода реквизитов оплаты картой (категория карты, RRN, номер соц. карты).
 */
export default function PosCardDetailsModal({
  open,
  cardType,
  initialCategory,
  amount,
  busy = false,
  onClose,
  onConfirm,
  t,
}) {
  const [form, setForm] = useState(() => createInitialCardDetails(initialCategory));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(createInitialCardDetails(initialCategory));
    setError(null);
  }, [open, cardType, initialCategory]);

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (busy) return;
    const result = validateAndNormalizeCardDetails(form, t);
    if (!result.ok) {
      setError(result);
      return;
    }
    setError(null);
    onConfirm?.(cardType, result.data);
  };

  const providerTitle = cardTypeLabel(cardType, t) || cardType || '';
  const modalTitle = `${t('pos.cardDetailsTitle', { defaultValue: 'Оплата картой' })}${
    providerTitle ? ` · ${providerTitle}` : ''
  }`;

  return (
    <BaseModal
      open={open}
      onClose={busy ? undefined : onClose}
      size="sm"
      title={modalTitle}
      closeLabel={t('common.close', { defaultValue: 'Закрыть' })}
      footer={
        <div className="pos-card-modal__actions">
          <BaseButton
            type="button"
            variant="secondary"
            className="pos-card-modal__cancel"
            onClick={onClose}
            disabled={busy}
          >
            {t('common.cancel')}
          </BaseButton>
          <BaseButton
            type="submit"
            form="pos-card-details-form"
            variant="primary"
            className="pos-card-modal__submit"
            disabled={busy}
          >
            {t('pos.cardConfirmPay', { defaultValue: 'Подтвердить и пробить' })}
          </BaseButton>
        </div>
      }
    >
      <form id="pos-card-details-form" className="pos-card-modal__body" onSubmit={handleSubmit}>
        <div className="pos-card-modal__summary">
          <span>{t('pos.amountToPay')}</span>
          <strong>{fmt(amount)}</strong>
        </div>

        <CardPaymentFields
          value={form}
          onChange={(next) => {
            setForm(next);
            if (error) setError(null);
          }}
          error={error}
          disabled={busy}
          autoFocusRrn
          idPrefix="pos-card-modal"
          t={t}
        />
      </form>
    </BaseModal>
  );
}

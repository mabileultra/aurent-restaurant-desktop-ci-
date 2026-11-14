import { useEffect, useState } from 'react';
import PosModalPortal from '../../../components/shared/PosModalPortal';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { cardTypeLabel } from '../../../utils/salePaymentLabel';
import PharmacyCardFields, {
  createInitialCardDetails,
  validateAndNormalizeCardDetails,
} from './PharmacyCardFields';
import '../styles/pharmacy-card-details.css';

/**
 * Модальное окно ввода реквизитов оплаты картой (тип карты, RRN, номер социальной карты).
 */
export default function PharmacyCardDetailsModal({
  open,
  cardType,
  amount,
  busy = false,
  onClose,
  onConfirm,
  t,
}) {
  const [form, setForm] = useState(createInitialCardDetails);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(createInitialCardDetails());
    setError(null);
  }, [open, cardType]);

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

  return (
    <PosModalPortal open={open} onClose={onClose}>
      <form
        className="pharmacy-modal pharmacy-modal__panel pharmacy-card-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('pos.cardDetailsTitle', { defaultValue: 'Оплата картой' })}
        onSubmit={handleSubmit}
      >
        <header className="pharmacy-modal__head">
          <h2 className="pharmacy-modal__title">
            {t('pos.cardDetailsTitle', { defaultValue: 'Оплата картой' })}
            {providerTitle ? ` · ${providerTitle}` : ''}
          </h2>
          <button
            type="button"
            className="pharmacy-modal__close"
            onClick={onClose}
            disabled={busy}
            aria-label={t('common.close', { defaultValue: 'Закрыть' })}
          >
            ×
          </button>
        </header>

        <div className="pharmacy-card-modal__body">
          <div className="pharmacy-card-modal__summary">
            <span>{t('pos.amountToPay')}</span>
            <strong>{fmt(amount)}</strong>
          </div>

          <PharmacyCardFields
            value={form}
            onChange={(next) => {
              setForm(next);
              if (error) setError(null);
            }}
            error={error}
            disabled={busy}
            autoFocusRrn
            t={t}
          />

          <div className="pharmacy-card-modal__actions">
            <button
              type="button"
              className="pharmacy-card-modal__btn"
              onClick={onClose}
              disabled={busy}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="pharmacy-card-modal__btn pharmacy-card-modal__btn--primary"
              disabled={busy}
            >
              {t('pos.cardConfirmPay', { defaultValue: 'Подтвердить и пробить' })}
            </button>
          </div>
        </div>
      </form>
    </PosModalPortal>
  );
}

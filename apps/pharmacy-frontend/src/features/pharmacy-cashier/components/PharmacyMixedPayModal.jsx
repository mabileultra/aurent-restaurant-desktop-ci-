import { useEffect, useState } from 'react';
import PosModalPortal from '../../../components/shared/PosModalPortal';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { parseTenderedInput } from '../../cashier/components/payment/posPaymentConstants';
import { ENABLED_PAYMENT_CARD_PROVIDERS } from '../../cashier/constants/paymentCardProviders';
import PharmacyCardFields, {
  createInitialCardDetails,
  validateAndNormalizeCardDetails,
} from './PharmacyCardFields';
import PharmacyPayQuickCash from './PharmacyPayQuickCash';
import '../styles/pharmacy-mixed-pay-modal.css';

/** Смешанная оплата: наличные в модалке, остаток — выбранной картой с реквизитами. */
export default function PharmacyMixedPayModal({ open, onClose, rail, busy, t }) {
  const received = parseTenderedInput(rail.cashInput);
  const [selectedCardType, setSelectedCardType] = useState(null);
  const [cardForm, setCardForm] = useState(createInitialCardDetails);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSelectedCardType(null);
    setCardForm(createInitialCardDetails());
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!rail.hasPartialCash && selectedCardType) {
      setSelectedCardType(null);
      setError(null);
    }
  }, [rail.hasPartialCash, selectedCardType]);

  const pickCard = (cardType) => {
    setSelectedCardType(cardType);
    setError(null);
  };

  const handleConfirm = (e) => {
    e?.preventDefault?.();
    if (!selectedCardType || busy) return;
    const result = validateAndNormalizeCardDetails(cardForm, t);
    if (!result.ok) {
      setError(result);
      return;
    }
    setError(null);
    rail.submitCard(selectedCardType, result.data);
    onClose();
  };

  return (
    <PosModalPortal open={open} onClose={onClose}>
      <form
        className="pharmacy-modal pharmacy-modal__panel pharmacy-mixed-pay"
        role="dialog"
        aria-modal="true"
        aria-label={t('pharmacyCashier.pay.methodMixed')}
        onSubmit={handleConfirm}
      >
        <header className="pharmacy-modal__head">
          <h2 className="pharmacy-modal__title">{t('pharmacyCashier.pay.methodMixed')}</h2>
          <button type="button" className="pharmacy-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        </header>
        <div className="pharmacy-mixed-pay__body">
          <div className="pharmacy-mixed-pay__row">
            <span>{t('pos.amountToPay')}</span>
            <strong>{fmt(rail.toPay)}</strong>
          </div>
          <div className="pharmacy-mixed-pay__row">
            <span>{t('pos.receivedLabel')}</span>
            <strong>{rail.cashInput ? fmt(received) : '—'}</strong>
          </div>
          <div className="pharmacy-mixed-pay__row">
            <span>{rail.hasPartialCash ? t('pos.cardRemainderRail') : t('pos.change')}</span>
            <strong>{fmt(rail.hasPartialCash ? rail.cardRemainder : rail.changeDue)}</strong>
          </div>
          <PharmacyPayQuickCash
            value={rail.cashInput}
            onChange={rail.setCashInput}
            exactAmount={rail.toPay}
            onExact={rail.setExactAmount}
            onReset={rail.clearCash}
            quickActions={rail.quickCash}
            disabled={busy}
            title={t('pharmacyCashier.pay.quickTitle')}
            exactLabel={t('pharmacyCashier.pay.exact')}
            resetLabel={t('pharmacyCashier.pay.reset')}
          />
          <div className="pharmacy-mixed-pay__cards">
            {ENABLED_PAYMENT_CARD_PROVIDERS.map((card) => {
              const active = selectedCardType === card.cardType;
              return (
                <button
                  key={card.id}
                  type="button"
                  className={`pharmacy-mixed-pay__card${active ? ' is-active' : ''}`}
                  disabled={busy}
                  aria-pressed={active}
                  onClick={() => pickCard(card.cardType)}
                >
                  <img src={card.logoSrc} alt="" />
                  <span>{t(card.labelKey)}</span>
                </button>
              );
            })}
          </div>

          {selectedCardType && rail.hasPartialCash ? (
            <div className="pharmacy-mixed-pay__card-details">
              <PharmacyCardFields
                value={cardForm}
                onChange={(next) => {
                  setCardForm(next);
                  if (error) setError(null);
                }}
                error={error}
                disabled={busy}
                autoFocusRrn
                t={t}
              />
              <button
                type="submit"
                className="pharmacy-card-modal__btn pharmacy-card-modal__btn--primary"
                disabled={busy}
              >
                {t('pos.cardConfirmPay', { defaultValue: 'Подтвердить и пробить' })}
              </button>
            </div>
          ) : null}
        </div>
      </form>
    </PosModalPortal>
  );
}

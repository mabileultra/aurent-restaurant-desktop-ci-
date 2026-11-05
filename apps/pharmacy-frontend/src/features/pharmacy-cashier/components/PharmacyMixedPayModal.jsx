import PosModalPortal from '../../../components/shared/PosModalPortal';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { parseTenderedInput } from '../../cashier/components/payment/posPaymentConstants';
import { ENABLED_PAYMENT_CARD_PROVIDERS } from '../../cashier/constants/paymentCardProviders';
import PharmacyPayQuickCash from './PharmacyPayQuickCash';
import '../styles/pharmacy-mixed-pay-modal.css';

/** Смешанная оплата: наличные в модалке, остаток — выбранной картой. */
export default function PharmacyMixedPayModal({ open, onClose, rail, busy, t }) {
  const received = parseTenderedInput(rail.cashInput);

  const pickCard = (cardType) => {
    const ready = rail.hasPartialCash;
    rail.submitCard(cardType);
    if (ready) onClose();
  };

  return (
    <PosModalPortal open={open} onClose={onClose}>
      <div className="pharmacy-modal pharmacy-modal__panel pharmacy-mixed-pay" role="dialog" aria-modal="true" aria-label={t('pharmacyCashier.pay.methodMixed')}>
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
            {ENABLED_PAYMENT_CARD_PROVIDERS.map((card) => (
              <button
                key={card.id}
                type="button"
                className="pharmacy-mixed-pay__card"
                disabled={busy}
                onClick={() => pickCard(card.cardType)}
              >
                <img src={card.logoSrc} alt="" />
                <span>{t(card.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PosModalPortal>
  );
}

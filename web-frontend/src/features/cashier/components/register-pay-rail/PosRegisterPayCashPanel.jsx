import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';
import { PosPayCashChangeValue, PosPayCashReceivedValue } from '../payment/PosPayCashAmountFields';

export default function PosRegisterPayCashPanel({
  toPay,
  tendered,
  changeDue,
  cashPaidEnough,
  cardRemainder,
  hasPartialCash,
}) {
  const { t } = useTranslation();

  return (
    <div className="pos-register-pay-cash pos-pay-cash-panel pos-pay-cash-panel--terminal">
      <div className="pos-pay-cash__summary-row">
        <span>{t('pos.amountToPay')}</span>
        <strong>{fmt(toPay)}</strong>
      </div>
      <p className="pos-pay-cash__hint">{t('pos.cashTenderHint')}</p>
      <div className="pos-pay-cash__received-box" aria-live="polite">
        <span className="pos-pay-cash__received-label">{t('pos.receivedLabel')}</span>
        <PosPayCashReceivedValue tendered={tendered} />
      </div>
      {hasPartialCash ? (
        <div
          className="pos-pay-cash__change-row pos-pay-cash__change-row--card-remainder"
          aria-live="polite"
        >
          <span>{t('pos.cardRemainderRail')}</span>
          <strong className="pos-pay-cash__card-remainder-value">{fmt(cardRemainder)}</strong>
        </div>
      ) : (
        <div
          className={`pos-pay-cash__change-row${cashPaidEnough ? ' pos-pay-cash__change-row--ready' : ''}`}
          aria-live="polite"
        >
          <span>{t('pos.change')}</span>
          <PosPayCashChangeValue changeDue={changeDue} ready={cashPaidEnough} />
        </div>
      )}
      {hasPartialCash ? (
        <p className="pos-pay-cash__hint pos-pay-cash__hint--card-remainder" role="status">
          {t('pos.cardRemainderHint')}
        </p>
      ) : null}
    </div>
  );
}

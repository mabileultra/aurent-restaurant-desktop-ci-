import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';
import { PosPayCashChangeValue, PosPayCashReceivedValue } from '../payment/PosPayCashAmountFields';

export default function PosRegisterPayCashPanel({
  toPay,
  tendered,
  changeDue,
  cashPaidEnough,
  cashShortfall,
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
      <div
        className={`pos-pay-cash__change-row${cashPaidEnough ? ' pos-pay-cash__change-row--ready' : ''}`}
        aria-live="polite"
      >
        <span>{t('pos.change')}</span>
        <PosPayCashChangeValue changeDue={changeDue} ready={cashPaidEnough} />
      </div>
      {cashShortfall > 0 ? (
        <p className="pos-pay-cash__shortfall" role="status">
          {t('pos.cashShortfall', { amount: fmt(cashShortfall) })}
        </p>
      ) : null}
    </div>
  );
}

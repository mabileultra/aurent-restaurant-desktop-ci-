import { ArrowDownCircle, CheckCircle2, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';
import { useCartStore } from '../../../../store/cartStore';
import { PosPayCashChangeValue, PosPayCashReceivedValue } from '../payment/PosPayCashAmountFields';

export default function PosRegisterPayCashPanel({
  toPay,
  tendered,
  changeDue,
  cashPaidEnough,
  cardRemainder,
  hasPartialCash,
  onDiscount,
}) {
  const { t } = useTranslation();
  const orderDiscount = useCartStore((s) => {
    void s.items;
    void s.orderDiscountAmount;
    return s.getOrderDiscount();
  });
  const discountPercent = useCartStore((s) => {
    void s.items;
    void s.orderDiscountAmount;
    return s.getCheckoutOrderDiscountPercent();
  });
  const hasDiscount = Number(orderDiscount) > 0;

  return (
    <div className="pos-register-pay-cash pos-pay-cash-panel pos-pay-cash-panel--terminal">
      <div className="pos-pay-cash__due">
        <div className="pos-pay-cash__due-head">
          <span className="pos-pay-cash__due-label">
            <CreditCard size={14} strokeWidth={2.25} aria-hidden />
            {t('pos.amountToPay')}
          </span>
          {hasDiscount ? (
            onDiscount ? (
              <button
                type="button"
                className="pos-pay-cash__discount-badge"
                onClick={onDiscount}
                title={t('pos.discountAppliedBadge', { percent: discountPercent })}
              >
                {t('pos.discountAppliedShort', { percent: discountPercent })}
              </button>
            ) : (
              <span
                className="pos-pay-cash__discount-badge"
                title={t('pos.discountAppliedBadge', { percent: discountPercent })}
              >
                {t('pos.discountAppliedShort', { percent: discountPercent })}
              </span>
            )
          ) : null}
        </div>
        <div className="pos-pay-cash__due-row">
          <strong className="pos-pay-cash__due-value">{fmt(toPay)}</strong>
          <span className="pos-pay-cash__currency-badge">{t('pos.currencyCode')}</span>
        </div>
      </div>

      <div className="pos-pay-cash__pair">
        <div className="pos-pay-cash__received-box" aria-live="polite">
          <span className="pos-pay-cash__received-label">
            {t('pos.receivedLabel')}
            <ArrowDownCircle size={16} strokeWidth={2.25} aria-hidden />
          </span>
          <PosPayCashReceivedValue tendered={tendered} />
        </div>
        {hasPartialCash ? (
          <div
            className="pos-pay-cash__change-box pos-pay-cash__change-box--remainder"
            aria-live="polite"
          >
            <span className="pos-pay-cash__change-label">
              {t('pos.cardRemainderRail')}
              <ArrowDownCircle size={16} strokeWidth={2.25} aria-hidden />
            </span>
            <strong className="pos-pay-cash__card-remainder-value">{fmt(cardRemainder)}</strong>
          </div>
        ) : (
          <div
            className={`pos-pay-cash__change-box${cashPaidEnough ? ' is-ready' : ''}`}
            aria-live="polite"
          >
            <span className="pos-pay-cash__change-label">
              {t('pos.change')}
              <CheckCircle2 size={16} strokeWidth={2.25} aria-hidden />
            </span>
            <PosPayCashChangeValue changeDue={changeDue} ready={cashPaidEnough} />
          </div>
        )}
      </div>
    </div>
  );
}

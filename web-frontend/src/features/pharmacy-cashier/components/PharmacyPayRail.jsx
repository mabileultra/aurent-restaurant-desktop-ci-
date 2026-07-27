import { useEffect } from 'react';
import { Banknote, MoreHorizontal, Percent, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { usePosRegisterPayRail } from '../../cashier/hooks/usePosRegisterPayRail';
import '../styles/pharmacy-pay-rail.css';

export default function PharmacyPayRail({
  linesTotal,
  orderDiscount,
  total,
  onReturn,
  onDiscount,
  onConfirm,
  onOpenPaymentFlow,
  checkoutDisabled,
  isPending,
  hotkeysEnabled = true,
}) {
  const { t } = useTranslation();
  const rail = usePosRegisterPayRail({
    total,
    checkoutDisabled,
    isPending,
    onConfirm,
    onOpenPaymentFlow,
  });

  const { submitCard } = rail;
  useEffect(() => {
    if (!hotkeysEnabled) return undefined;
    const onKey = (e) => {
      if (e.key === 'F10') {
        e.preventDefault();
        submitCard('HUMO');
      } else if (e.key === 'F11') {
        e.preventDefault();
        submitCard('UZCARD');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkeysEnabled, submitCard]);

  return (
    <aside className="pharmacy-pay-rail" aria-label={t('pos.paymentTitle')}>
      <div className="pharmacy-pay-rail__totals">
        <p className="pharmacy-pay-rail__row">
          <span>{t('pos.subtotal')}</span>
          <strong>{fmt(linesTotal)}</strong>
        </p>
        <p className="pharmacy-pay-rail__row">
          <span>{t('pos.discount')}</span>
          <strong>{fmt(Number(orderDiscount ?? 0))}</strong>
        </p>
        <p className="pharmacy-pay-rail__row pharmacy-pay-rail__row--pay">
          <span>{t('pos.amountToPay')}</span>
          <strong>{fmt(rail.toPay)}</strong>
        </p>
      </div>

      <div className="pharmacy-pay-rail__quick">
        <button
          type="button"
          className="pharmacy-pay-rail__btn pharmacy-pay-rail__btn--cash"
          disabled={rail.saleDisabled}
          onClick={rail.submitCash}
        >
          <Banknote size={20} strokeWidth={2.25} aria-hidden />
          {t('pharmacyCashier.payCash')}
        </button>
        <button
          type="button"
          className="pharmacy-pay-rail__btn pharmacy-pay-rail__btn--humo"
          disabled={checkoutDisabled || isPending || rail.cardPayBlocked}
          onClick={() => rail.submitCard('HUMO')}
        >
          {t('pos.cardHumo')}
          <span className="pharmacy-pay-rail__hotkey">F10</span>
        </button>
        <button
          type="button"
          className="pharmacy-pay-rail__btn pharmacy-pay-rail__btn--uzcard"
          disabled={checkoutDisabled || isPending || rail.cardPayBlocked}
          onClick={() => rail.submitCard('UZCARD')}
        >
          {t('pos.cardUzcard')}
          <span className="pharmacy-pay-rail__hotkey">F11</span>
        </button>
        <button
          type="button"
          className="pharmacy-pay-rail__btn pharmacy-pay-rail__btn--more"
          disabled={checkoutDisabled || isPending}
          onClick={() => onOpenPaymentFlow?.({})}
        >
          <MoreHorizontal size={18} strokeWidth={2.5} aria-hidden />
          {t('pharmacyCashier.payMore')}
        </button>
      </div>

      <label className="pharmacy-pay-rail__print">
        <input
          type="checkbox"
          checked={rail.printReceiptEnabled}
          onChange={rail.handlePrintReceiptChange}
        />
        {t('pos.printReceiptShort')}
      </label>

      <div className="pharmacy-pay-rail__tools">
        <button type="button" className="pharmacy-pay-rail__tool" onClick={onDiscount}>
          <Percent size={16} strokeWidth={2.25} aria-hidden />
          {t('pos.discount')}
        </button>
        <button type="button" className="pharmacy-pay-rail__tool" onClick={onReturn}>
          <RotateCcw size={16} strokeWidth={2.25} aria-hidden />
          {t('pos.return')}
        </button>
      </div>
    </aside>
  );
}

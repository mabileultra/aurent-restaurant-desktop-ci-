import { Percent, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import NumericKeypad from '../NumericKeypad';
import PosRegisterPayCashPanel from './PosRegisterPayCashPanel';
import PosRegisterPayMethods from './PosRegisterPayMethods';
import PosRegisterCardProviders from './PosRegisterCardProviders';
import PosRegisterPayFooter from './PosRegisterPayFooter';
import { usePosRegisterPayRail } from '../../hooks/usePosRegisterPayRail';

export default function PosRegisterPayRail({
  total,
  onReturn,
  onDiscount,
  onConfirm,
  onOpenPaymentFlow,
  checkoutDisabled,
  isPending,
}) {
  const { t } = useTranslation();
  const rail = usePosRegisterPayRail({
    total,
    checkoutDisabled,
    isPending,
    onConfirm,
    onOpenPaymentFlow,
  });

  return (
    <aside className="pos-register-pay-rail" aria-label={t('pos.paymentTitle')}>
      <PosRegisterPayCashPanel
        toPay={rail.toPay}
        tendered={rail.tendered}
        changeDue={rail.changeDue}
        cashPaidEnough={rail.cashPaidEnough}
        cardRemainder={rail.cardRemainder}
        hasPartialCash={rail.hasPartialCash}
      />

      <div className="pos-register-pay-rail__pay-block">
        <PosRegisterPayMethods
          disabled={checkoutDisabled || isPending}
          onCashless={rail.submitCashless}
          onCredit={rail.openCredit}
          onAdvance={rail.openAdvance}
        />

        <PosRegisterCardProviders
          disabled={checkoutDisabled}
          isPending={isPending}
          cardPayBlocked={rail.cardPayBlocked}
          hasCardRemainder={rail.hasPartialCash}
          onSelectCard={rail.submitCard}
        />
      </div>

      <div className="pos-register-pay-rail__keypad-wrap">
        <NumericKeypad
          value={rail.tendered}
          onChange={rail.setTendered}
          exactAmount={rail.toPay}
          hideActionKey
          hideBottomClear
          disabled={checkoutDisabled || isPending}
        />
      </div>

      <div className="pos-register-pay-rail__tools">
        <button
          type="button"
          className="pos-register-pay-rail__tool pos-register-pay-rail__tool--discount"
          onClick={onDiscount}
        >
          <Percent size={18} strokeWidth={2.25} aria-hidden />
          {t('pos.discount')}
        </button>
        <button
          type="button"
          className="pos-register-pay-rail__tool pos-register-pay-rail__tool--return"
          onClick={onReturn}
        >
          <RotateCcw size={18} strokeWidth={2.25} aria-hidden />
          {t('pos.return')}
        </button>
      </div>

      <PosRegisterPayFooter
        disabled={rail.saleDisabled}
        isPending={isPending}
        printReceiptEnabled={rail.printReceiptEnabled}
        onPrintReceiptChange={rail.handlePrintReceiptChange}
        onSale={rail.submitCash}
      />
    </aside>
  );
}

import { Percent, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import NumericKeypad from '../NumericKeypad';
import FiscalDriveCashierControls from '../FiscalDriveCashierControls';
import MultikassaCashierControls from '../MultikassaCashierControls';
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
  hideTools = false,
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
      <div className="pos-register-pay-rail__fiscal">
        <MultikassaCashierControls />
        <FiscalDriveCashierControls className="pos-register-pay-rail__fiscal-fd" />
      </div>
      <PosRegisterPayCashPanel
        toPay={rail.toPay}
        tendered={rail.tendered}
        changeDue={rail.changeDue}
        cashPaidEnough={rail.cashPaidEnough}
        cardRemainder={rail.cardRemainder}
        hasPartialCash={rail.hasPartialCash}
        onDiscount={onDiscount}
      />

      <div className="pos-register-pay-rail__pay-block">
        <PosRegisterPayMethods
          disabled={checkoutDisabled || isPending}
          cardPayBlocked={rail.cardPayBlocked}
          onCashless={rail.submitCashless}
          onCredit={rail.openCredit}
          onAdvance={rail.openAdvance}
          onCorporate={rail.submitCorporate}
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

      {!hideTools ? (
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
      ) : null}

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

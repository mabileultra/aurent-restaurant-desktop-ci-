import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { round2 } from '../../../utils/taxAmounts';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import {
  isPosReceiptPrintEnabled,
  setPosReceiptPrintEnabled,
} from '../../../utils/receiptPrintPreference';
import { parseTenderedInput } from '../components/payment/posPaymentConstants';

export function usePosRegisterPayRail({
  total,
  checkoutDisabled,
  isPending,
  onConfirm,
  onOpenPaymentFlow,
}) {
  const { t } = useTranslation();
  const [tendered, setTendered] = useState('');
  const [printReceiptEnabled, setPrintReceiptEnabled] = useState(isPosReceiptPrintEnabled);

  const toPay = round2(total);

  useEffect(() => {
    if (toPay <= 0) setTendered('');
  }, [toPay]);

  const tenderedNum = parseTenderedInput(tendered);
  const changeDue = round2(Math.max(0, tenderedNum - toPay));
  const cashPaidEnough = tenderedNum >= toPay && tenderedNum > 0;
  const cashShortfall =
    tenderedNum > 0 && tenderedNum < toPay ? round2(toPay - tenderedNum) : 0;

  const guardCheckout = useCallback(() => {
    if (checkoutDisabled || isPending) return false;
    if (toPay <= 0) {
      toast.error(t('pos.cartEmpty'));
      return false;
    }
    return true;
  }, [checkoutDisabled, isPending, toPay, t]);

  const submitCash = useCallback(() => {
      if (!guardCheckout()) return;
      const entered = parseTenderedInput(tendered);
      const amountTendered = entered > 0 ? entered : toPay;
      if (amountTendered < toPay) {
        toast.error(t('pos.cashShortfall', { amount: fmt(round2(toPay - amountTendered)) }));
        return;
      }
      onConfirm({
        paymentMethod: 'CASH',
        receiptType: 'SALE',
        cardType: null,
        amountTendered,
        printReceipt: printReceiptEnabled,
      });
    },
    [guardCheckout, onConfirm, printReceiptEnabled, t, tendered, toPay],
  );

  const handlePrintReceiptChange = useCallback((event) => {
    const next = Boolean(event.target.checked);
    setPrintReceiptEnabled(next);
    setPosReceiptPrintEnabled(next);
  }, []);

  const submitCard = useCallback(
    (cardType) => {
      if (!guardCheckout()) return;
      onConfirm({
        paymentMethod: 'CARD',
        receiptType: 'SALE',
        cardType,
        amountTendered: toPay,
        printReceipt: isPosReceiptPrintEnabled(),
      });
    },
    [guardCheckout, onConfirm, toPay],
  );

  const submitCashless = useCallback(() => {
    if (!guardCheckout()) return;
    onConfirm({
      paymentMethod: 'CASHLESS',
      receiptType: 'SALE',
      cardType: null,
      amountTendered: toPay,
      printReceipt: isPosReceiptPrintEnabled(),
    });
  }, [guardCheckout, onConfirm, toPay]);

  const openMixed = useCallback(() => {
    if (!guardCheckout()) return;
    onOpenPaymentFlow({ step: 'mixedCash', payMethod: 'mixed' });
  }, [guardCheckout, onOpenPaymentFlow]);

  const openCredit = useCallback(() => {
    if (!guardCheckout()) return;
    onOpenPaymentFlow({ step: 'creditCustomer', receiptType: 'CREDIT' });
  }, [guardCheckout, onOpenPaymentFlow]);

  const openAdvance = useCallback(() => {
    if (!guardCheckout()) return;
    onOpenPaymentFlow({ step: 'creditCustomer', payMethod: 'advance' });
  }, [guardCheckout, onOpenPaymentFlow]);

  return {
    tendered,
    setTendered,
    toPay,
    changeDue,
    cashPaidEnough,
    cashShortfall,
    submitCash,
    submitCard,
    submitCashless,
    openMixed,
    openCredit,
    openAdvance,
    printReceiptEnabled,
    handlePrintReceiptChange,
  };
}

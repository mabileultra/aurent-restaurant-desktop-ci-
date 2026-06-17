import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { round2 } from '../../../utils/taxAmounts';
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
  const cardRemainder =
    tenderedNum > 0 && tenderedNum < toPay ? round2(toPay - tenderedNum) : 0;
  const hasPartialCash = cardRemainder > 0;
  const cardPayBlocked = tenderedNum >= toPay && tenderedNum > 0;

  const guardCheckout = useCallback(() => {
    if (checkoutDisabled || isPending) return false;
    if (toPay <= 0) {
      toast.error(t('pos.cartEmpty'));
      return false;
    }
    return true;
  }, [checkoutDisabled, isPending, toPay, t]);

  const submitCash = useCallback(() => {
    if (!guardCheckout() || hasPartialCash) return;
    const entered = parseTenderedInput(tendered);
    const amountTendered = entered > 0 ? entered : toPay;
    if (amountTendered < toPay) return;
    onConfirm({
      paymentMethod: 'CASH',
      receiptType: 'SALE',
      cardType: null,
      amountTendered,
      printReceipt: printReceiptEnabled,
    });
  }, [guardCheckout, hasPartialCash, onConfirm, printReceiptEnabled, tendered, toPay]);

  const handlePrintReceiptChange = useCallback((event) => {
    const next = Boolean(event.target.checked);
    setPrintReceiptEnabled(next);
    setPosReceiptPrintEnabled(next);
  }, []);

  const submitCard = useCallback(
    (cardType) => {
      if (!guardCheckout() || cardPayBlocked) return;
      const entered = parseTenderedInput(tendered);
      if (hasPartialCash) {
        onConfirm({
          paymentMethod: 'MIXED',
          receiptType: 'SALE',
          cardType,
          cashAmount: entered,
          cardAmount: cardRemainder,
          amountTendered: entered,
          printReceipt: isPosReceiptPrintEnabled(),
        });
        return;
      }
      onConfirm({
        paymentMethod: 'CARD',
        receiptType: 'SALE',
        cardType,
        amountTendered: toPay,
        printReceipt: isPosReceiptPrintEnabled(),
      });
    },
    [cardPayBlocked, cardRemainder, guardCheckout, hasPartialCash, onConfirm, tendered, toPay],
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
    cardRemainder,
    hasPartialCash,
    cardPayBlocked,
    submitCash,
    submitCard,
    submitCashless,
    openCredit,
    openAdvance,
    printReceiptEnabled,
    handlePrintReceiptChange,
    saleDisabled: checkoutDisabled || isPending || hasPartialCash,
  };
}

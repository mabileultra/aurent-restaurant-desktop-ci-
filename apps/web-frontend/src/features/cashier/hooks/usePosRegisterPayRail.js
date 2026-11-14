import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { CARD_CATEGORY } from '@aurent/shared-types';
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
  const [cardModal, setCardModal] = useState({
    open: false,
    cardType: null,
    initialCategory: CARD_CATEGORY.PERSONAL,
  });

  const toPay = round2(total);

  useEffect(() => {
    if (toPay <= 0) {
      setTendered('');
      setCardModal({
        open: false,
        cardType: null,
        initialCategory: CARD_CATEGORY.PERSONAL,
      });
    }
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
    (cardType, cardDetails = null) => {
      if (!guardCheckout() || cardPayBlocked) return;
      const entered = parseTenderedInput(tendered);
      const details = cardDetails
        ? {
            cardCategory: cardDetails.cardCategory,
            rrn: cardDetails.rrn,
            socialCardNumber: cardDetails.socialCardNumber,
          }
        : {};
      if (hasPartialCash) {
        onConfirm({
          paymentMethod: 'MIXED',
          receiptType: 'SALE',
          cardType,
          ...details,
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
        ...details,
        amountTendered: toPay,
        printReceipt: isPosReceiptPrintEnabled(),
      });
    },
    [cardPayBlocked, cardRemainder, guardCheckout, hasPartialCash, onConfirm, tendered, toPay],
  );

  const requestCardCheckout = useCallback(
    (cardType, initialCategory = CARD_CATEGORY.PERSONAL) => {
      if (!guardCheckout() || cardPayBlocked) return;
      setCardModal({
        open: true,
        cardType: cardType || null,
        initialCategory,
      });
    },
    [cardPayBlocked, guardCheckout],
  );

  const closeCardModal = useCallback(() => {
    setCardModal((prev) => ({ ...prev, open: false }));
  }, []);

  const confirmCardDetails = useCallback(
    (cardType, cardDetails) => {
      setCardModal((prev) => ({ ...prev, open: false }));
      submitCard(cardType, cardDetails);
    },
    [submitCard],
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

  const submitCorporate = useCallback(() => {
    requestCardCheckout(null, CARD_CATEGORY.CORPORATE);
  }, [requestCardCheckout]);

  return {
    tendered,
    setTendered,
    toPay,
    changeDue,
    cashPaidEnough,
    cardRemainder,
    hasPartialCash,
    cardPayBlocked,
    cardModal,
    cardModalAmount: hasPartialCash ? cardRemainder : toPay,
    submitCash,
    submitCard,
    requestCardCheckout,
    closeCardModal,
    confirmCardDetails,
    submitCashless,
    openCredit,
    openAdvance,
    submitCorporate,
    printReceiptEnabled,
    handlePrintReceiptChange,
    saleDisabled: checkoutDisabled || isPending || hasPartialCash,
  };
}

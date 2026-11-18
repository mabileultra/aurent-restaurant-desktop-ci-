import { round2 } from '../../../utils/taxAmounts';
import {
  STEPS_WITH_PRINT_TOGGLE,
  parseTenderedInput,
} from '../components/payment/posPaymentConstants';

/**
 * Calculates tendered amount, change due, and sufficiency flags.
 */
export function calculateCashPaymentState(tendered, effectiveToPay) {
  const tenderedNum = parseTenderedInput(tendered);
  const changeDue = round2(Math.max(0, tenderedNum - effectiveToPay));
  const cashPaidEnough = tenderedNum >= effectiveToPay && tenderedNum > 0;
  const cashShortfall = tenderedNum > 0 && tenderedNum < effectiveToPay
    ? round2(effectiveToPay - tenderedNum)
    : 0;

  return { tenderedNum, changeDue, cashPaidEnough, cashShortfall };
}

/**
 * Resolves current payment flow title based on step and method.
 */
export function resolvePaymentStepTitle({ step, payMethod, t }) {
  if (step === 'method') return t('pos.choosePaymentMethod');
  if (step === 'cash') return t('pos.payCash');
  if (step === 'cardType') return t('pos.cardTypeTitle');
  if (step === 'advanceAmount') return t('pos.advanceAmountTitle');
  if (step === 'creditCustomer') {
    return payMethod === 'advance'
      ? t('pos.advanceCustomerTitle')
      : t('pos.creditCustomerTitle');
  }
  return t('pos.choosePaymentMethod');
}

/**
 * Resolves step back navigation callback.
 */
export function resolvePaymentStepBack({
  step,
  advanceAmountUsed,
  setAdvanceAmountUsed,
  setStep,
  setTendered,
  handleClose,
}) {
  if (step === 'method') {
    return () => {
      if (advanceAmountUsed > 0) {
        setAdvanceAmountUsed(0);
        setStep('advanceAmount');
        return;
      }
      handleClose();
    };
  }
  if (step === 'advanceAmount') return () => setStep('creditCustomer');
  if (step === 'creditCustomer') return () => handleClose();
  if (step === 'cash') {
    return () => {
      setTendered('');
      setStep('method');
    };
  }
  if (step === 'cardType') return () => setStep('method');
  return null;
}

/**
 * Resolves header amount and visibility flags for payment steps.
 */
export function resolvePaymentStepFlags({ step, checkTotal, effectiveToPay }) {
  const headerPayAmount = step === 'advanceAmount' ? checkTotal : effectiveToPay;
  const showHeaderAmount =
    step === 'creditCustomer' ||
    step === 'advanceAmount' ||
    step === 'method' ||
    step === 'cash' ||
    step === 'cardType';

  const showRegisterBackToCheck = step === 'method' || step === 'cash';
  const showPrintToggle = STEPS_WITH_PRINT_TOGGLE.has(step);
  const showFooterPrimary =
    step === 'creditCustomer' ||
    step === 'advanceAmount' ||
    step === 'cash';

  return {
    headerPayAmount,
    showHeaderAmount,
    showRegisterBackToCheck,
    showPrintToggle,
    showFooterPrimary,
  };
}

export function withCreditCustomer(payment, { receiptType, selectedId, selectedName }) {
  if (receiptType !== 'CREDIT') return payment;
  return {
    ...payment,
    customerId: selectedId || payment.customerId,
    customerName: selectedName || payment.customerName,
  };
}

export function withAdvancePayment(payment, { receiptType, selectedId, selectedName, advanceAmountUsed }) {
  const base = withCreditCustomer(payment, { receiptType, selectedId, selectedName });
  if (advanceAmountUsed <= 0) return base;
  return {
    ...base,
    customerId: selectedId,
    customerName: selectedName,
    advanceAmount: advanceAmountUsed,
  };
}


export function createPaymentSubmissions({
  onConfirm,
  receiptType,
  effectiveToPay,
  printReceiptEnabled,
  decoratePayment,
  isPending,
}) {
  return {
    submitCard: (type, cardDetails = null) => {
      const details = cardDetails
        ? {
            cardCategory: cardDetails.cardCategory,
            rrn: cardDetails.rrn,
            socialCardNumber: cardDetails.socialCardNumber,
          }
        : {};
      onConfirm(decoratePayment({
        paymentMethod: 'CARD',
        receiptType,
        cardType: type,
        ...details,
        amountTendered: effectiveToPay,
        printReceipt: printReceiptEnabled,
      }));
    },
    submitCash: (tendered) => {
      const amount = parseTenderedInput(tendered);
      if (amount < effectiveToPay) return;
      onConfirm(decoratePayment({
        paymentMethod: 'CASH',
        receiptType,
        cardType: null,
        amountTendered: amount,
        printReceipt: printReceiptEnabled,
      }));
    },
    submitCashless: () => {
      if (isPending) return;
      onConfirm(decoratePayment({
        paymentMethod: 'CASHLESS',
        receiptType,
        cardType: null,
        amountTendered: effectiveToPay,
        printReceipt: printReceiptEnabled,
      }));
    },
    submitCredit: (customerId, customerName) => {
      if (isPending || !customerId) return;
      onConfirm({
        paymentMethod: 'CASH',
        receiptType: 'CREDIT',
        cardType: null,
        cashAmount: 0,
        cardAmount: 0,
        amountTendered: 0,
        customerId,
        customerName,
        printReceipt: printReceiptEnabled,
      });
    },
  };
}

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { financeApi } from '../../../api/finance.api';
import { round2 } from '../../../utils/taxAmounts';
import { setPosReceiptPrintEnabled, isPosReceiptPrintEnabled } from '../../../utils/receiptPrintPreference';
import {
  STEPS_WITH_PRINT_TOGGLE,
  amountStr,
  buildPaymentFlowState,
  parseTenderedInput,
} from '../components/payment/posPaymentConstants';
import { usePosCreditCustomerPicker } from './usePosCreditCustomerPicker';

export function usePosPaymentFlow({
  onClose,
  total,
  onConfirm,
  isPending,
  openOptions = null,
  cartCustomer = null,
}) {
  const { t } = useTranslation();
  const initialState = buildPaymentFlowState(openOptions);

  const [step, setStep] = useState(initialState.step);
  const [receiptType, setReceiptType] = useState(initialState.receiptType);
  const [payMethod, setPayMethod] = useState(initialState.payMethod);
  const [tendered, setTendered] = useState('');
  const [printReceiptEnabled, setPrintReceiptEnabled] = useState(isPosReceiptPrintEnabled);
  const [advanceAmountUsed, setAdvanceAmountUsed] = useState(0);
  const [advanceInput, setAdvanceInput] = useState('');
  const [advanceBalance, setAdvanceBalance] = useState(0);

  const creditCustomer = usePosCreditCustomerPicker({ enabled: step === 'creditCustomer' });

  const reset = (overrides = {}) => {
    if (!overrides.step) return;
    setStep(overrides.step);
    setReceiptType(overrides.receiptType ?? 'SALE');
    setPayMethod(overrides.payMethod ?? null);
    setTendered('');
    setAdvanceAmountUsed(0);
    setAdvanceInput('');
    setAdvanceBalance(0);
    setPrintReceiptEnabled(isPosReceiptPrintEnabled());
    creditCustomer.reset();
  };

  const handleClose = () => {
    onClose();
  };

  const checkTotal = round2(total);
  const effectiveToPay = advanceAmountUsed > 0
    ? round2(Math.max(0, checkTotal - advanceAmountUsed))
    : checkTotal;

  useEffect(() => {
    if (!openOptions?.step) return;
    reset(openOptions);
  }, [openOptions]);

  useEffect(() => {
    if (step !== 'creditCustomer' || !cartCustomer?.id) return;
    if (creditCustomer.selectedId) return;
    creditCustomer.selectCustomer({
      id: cartCustomer.id,
      name: cartCustomer.name || '',
    });
    // Prefill once when entering credit/advance customer step
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit creditCustomer object
  }, [step, cartCustomer?.id, cartCustomer?.name, creditCustomer.selectedId, creditCustomer.selectCustomer]);

  const goToCash = () => {
    setPayMethod((prev) => (prev === 'advance' ? 'advance' : 'cash'));
    setTendered(effectiveToPay > 0 ? amountStr(effectiveToPay) : '');
    setStep('cash');
  };

  const handleMethod = (action) => {
    if (action === 'cash') goToCash();
    else if (action === 'card') {
      setPayMethod(advanceAmountUsed > 0 ? 'advance' : 'card');
      setStep('cardType');
    } else if (action === 'cashless') submitCashless();
  };

  const tenderedNum = parseTenderedInput(tendered);
  const changeDue = round2(Math.max(0, tenderedNum - effectiveToPay));
  const cashPaidEnough = tenderedNum >= effectiveToPay && tenderedNum > 0;
  const cashShortfall = tenderedNum > 0 && tenderedNum < effectiveToPay
    ? round2(effectiveToPay - tenderedNum)
    : 0;

  const withCreditCustomer = (payment) => {
    if (receiptType !== 'CREDIT') return payment;
    return {
      ...payment,
      customerId: creditCustomer.selectedId || payment.customerId,
      customerName: creditCustomer.selectedName || payment.customerName,
    };
  };

  const withAdvancePayment = (payment) => {
    const base = withCreditCustomer(payment);
    if (advanceAmountUsed <= 0) return base;
    return {
      ...base,
      customerId: creditCustomer.selectedId,
      customerName: creditCustomer.selectedName,
      advanceAmount: advanceAmountUsed,
    };
  };

  const submitCard = (type) => {
    onConfirm(withAdvancePayment({
      paymentMethod: 'CARD',
      receiptType,
      cardType: type,
      amountTendered: effectiveToPay,
      printReceipt: printReceiptEnabled,
    }));
  };

  const submitCash = () => {
    const amount = parseTenderedInput(tendered);
    if (amount < effectiveToPay) return;
    onConfirm(withAdvancePayment({
      paymentMethod: 'CASH',
      receiptType,
      cardType: null,
      amountTendered: amount,
      printReceipt: printReceiptEnabled,
    }));
  };

  const submitCashless = () => {
    if (isPending) return;
    onConfirm(withAdvancePayment({
      paymentMethod: 'CASHLESS',
      receiptType,
      cardType: null,
      amountTendered: effectiveToPay,
      printReceipt: printReceiptEnabled,
    }));
  };

  const submitCredit = (customerId, customerName) => {
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
  };

  const submitFullAdvance = (amount) => {
    if (isPending || !creditCustomer.selectedId) return;
    onConfirm({
      paymentMethod: 'CASH',
      receiptType: 'SALE',
      cardType: null,
      cashAmount: 0,
      cardAmount: 0,
      amountTendered: 0,
      customerId: creditCustomer.selectedId,
      customerName: creditCustomer.selectedName,
      advanceAmount: amount,
      printReceipt: printReceiptEnabled,
    });
  };

  const submitCreditWithCustomer = async () => {
    if (!creditCustomer.selectedId) {
      toast.error(t('pos.creditCustomerRequired'));
      return;
    }
    if (payMethod === 'advance') {
      try {
        const balance = await financeApi.debts.advances.balance(creditCustomer.selectedId).then((r) => r.data);
        const available = round2(Number(balance) || 0);
        if (available <= 0) {
          toast.error(t('pos.advanceNotAvailable'));
          return;
        }
        const maxUse = Math.min(available, checkTotal);
        setAdvanceBalance(available);
        setAdvanceInput(amountStr(maxUse));
        setStep('advanceAmount');
      } catch {
        toast.error(t('pos.advanceBalanceLoadFailed'));
      }
      return;
    }
    submitCredit(creditCustomer.selectedId, creditCustomer.selectedName);
  };

  const submitAdvanceAmount = () => {
    const amount = round2(Number(advanceInput) || 0);
    const maxUse = Math.min(advanceBalance, checkTotal);
    if (amount <= 0 || amount > maxUse) {
      toast.error(t('pos.advanceAmountInvalid'));
      return;
    }
    setAdvanceAmountUsed(amount);
    const remainder = round2(checkTotal - amount);
    if (remainder > 0.001) {
      setStep('method');
      return;
    }
    submitFullAdvance(amount);
  };

  const handlePrintReceiptChange = (e) => {
    const next = Boolean(e.target.checked);
    setPrintReceiptEnabled(next);
    setPosReceiptPrintEnabled(next);
  };

  let stepTitle = t('pos.choosePaymentMethod');
  if (step === 'method') stepTitle = t('pos.choosePaymentMethod');
  else if (step === 'cash') stepTitle = t('pos.payCash');
  else if (step === 'cardType') stepTitle = t('pos.cardTypeTitle');
  else if (step === 'advanceAmount') stepTitle = t('pos.advanceAmountTitle');
  else if (step === 'creditCustomer') {
    stepTitle = payMethod === 'advance'
      ? t('pos.advanceCustomerTitle')
      : t('pos.creditCustomerTitle');
  }

  const stepBack =
    step === 'method'
      ? () => {
          if (advanceAmountUsed > 0) {
            setAdvanceAmountUsed(0);
            setStep('advanceAmount');
            return;
          }
          handleClose();
        }
      : step === 'advanceAmount'
        ? () => setStep('creditCustomer')
        : step === 'creditCustomer'
          ? () => handleClose()
          : step === 'cash'
            ? () => {
                setTendered('');
                setStep('method');
              }
            : step === 'cardType'
              ? () => setStep('method')
              : null;

  const headerPayAmount =
    step === 'advanceAmount' ? checkTotal : effectiveToPay;
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
    t,
    step,
    receiptType,
    payMethod,
    tendered,
    setTendered,
    printReceiptEnabled,
    toPay: effectiveToPay,
    checkTotal,
    advanceInput,
    setAdvanceInput,
    advanceBalance,
    handleClose,
    handleMethod,
    handlePrintReceiptChange,
    submitCard,
    changeDue,
    cashPaidEnough,
    cashShortfall,
    isPending,
    stepTitle,
    registerBack: stepBack,
    showHeaderAmount,
    headerPayAmount,
    submitCreditWithCustomer,
    submitAdvanceAmount,
    creditCustomer,
    submitCash,
    showRegisterBackToCheck,
    showPrintToggle,
    showFooterPrimary,
  };
}

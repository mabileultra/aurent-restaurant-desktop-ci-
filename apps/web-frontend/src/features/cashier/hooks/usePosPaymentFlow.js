import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { round2 } from '../../../utils/taxAmounts';
import { setPosReceiptPrintEnabled, isPosReceiptPrintEnabled } from '../../../utils/receiptPrintPreference';
import {
  amountStr,
  buildPaymentFlowState,
} from '../components/payment/posPaymentConstants';
import { usePosCreditCustomerPicker } from './usePosCreditCustomerPicker';
import { usePosAdvancePayment } from './usePosAdvancePayment';
import {
  calculateCashPaymentState,
  resolvePaymentStepTitle,
  resolvePaymentStepBack,
  resolvePaymentStepFlags,
  withAdvancePayment,
  createPaymentSubmissions,
} from '../utils/posPaymentFlowHelpers';

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

  const creditCustomer = usePosCreditCustomerPicker({ enabled: step === 'creditCustomer' });
  const checkTotal = round2(total);

  const advance = usePosAdvancePayment({
    creditCustomer,
    checkTotal,
    payMethod,
    setStep,
    onConfirm,
    printReceiptEnabled,
    isPending,
    t,
  });

  const effectiveToPay = advance.advanceAmountUsed > 0
    ? round2(Math.max(0, checkTotal - advance.advanceAmountUsed))
    : checkTotal;

  const reset = (overrides = {}) => {
    if (!overrides.step) return;
    setStep(overrides.step);
    setReceiptType(overrides.receiptType ?? 'SALE');
    setPayMethod(overrides.payMethod ?? null);
    setTendered('');
    advance.resetAdvance();
    setPrintReceiptEnabled(isPosReceiptPrintEnabled());
    creditCustomer.reset();
  };

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
  }, [step, cartCustomer?.id, cartCustomer?.name, creditCustomer.selectedId, creditCustomer.selectCustomer]);

  const goToCash = () => {
    setPayMethod((prev) => (prev === 'advance' ? 'advance' : 'cash'));
    setTendered(effectiveToPay > 0 ? amountStr(effectiveToPay) : '');
    setStep('cash');
  };

  const { changeDue, cashPaidEnough, cashShortfall } = calculateCashPaymentState(tendered, effectiveToPay);

  const decoratePayment = (payment) =>
    withAdvancePayment(payment, {
      receiptType,
      selectedId: creditCustomer.selectedId,
      selectedName: creditCustomer.selectedName,
      advanceAmountUsed: advance.advanceAmountUsed,
    });

  const { submitCard, submitCash, submitCashless, submitCredit } = createPaymentSubmissions({
    onConfirm,
    receiptType,
    effectiveToPay,
    printReceiptEnabled,
    decoratePayment,
    isPending,
  });

  const handleMethod = (action) => {
    if (action === 'cash') goToCash();
    else if (action === 'card') {
      setPayMethod(advance.advanceAmountUsed > 0 ? 'advance' : 'card');
      setStep('cardType');
    } else if (action === 'cashless') submitCashless();
  };

  const handlePrintReceiptChange = (e) => {
    const next = Boolean(e.target.checked);
    setPrintReceiptEnabled(next);
    setPosReceiptPrintEnabled(next);
  };

  const stepTitle = resolvePaymentStepTitle({ step, payMethod, t });
  const stepBack = resolvePaymentStepBack({
    step,
    advanceAmountUsed: advance.advanceAmountUsed,
    setAdvanceAmountUsed: advance.setAdvanceAmountUsed,
    setStep,
    setTendered,
    handleClose: onClose,
  });

  const {
    headerPayAmount,
    showHeaderAmount,
    showRegisterBackToCheck,
    showPrintToggle,
    showFooterPrimary,
  } = resolvePaymentStepFlags({ step, checkTotal, effectiveToPay });

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
    advanceInput: advance.advanceInput,
    setAdvanceInput: advance.setAdvanceInput,
    advanceBalance: advance.advanceBalance,
    handleClose: onClose,
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
    submitCreditWithCustomer: () => advance.submitCreditWithCustomer(submitCredit),
    submitAdvanceAmount: advance.submitAdvanceAmount,
    creditCustomer,
    submitCash: () => submitCash(tendered),
    showRegisterBackToCheck,
    showPrintToggle,
    showFooterPrimary,
  };
}

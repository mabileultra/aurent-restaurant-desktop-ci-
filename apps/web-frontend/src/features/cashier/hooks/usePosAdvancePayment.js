import { useState } from 'react';
import toast from 'react-hot-toast';
import { financeApi } from '../../../api/finance.api';
import { round2 } from '../../../utils/taxAmounts';
import { amountStr } from '../components/payment/posPaymentConstants';

export function usePosAdvancePayment({
  creditCustomer,
  checkTotal,
  payMethod,
  setStep,
  onConfirm,
  printReceiptEnabled,
  isPending,
  t,
}) {
  const [advanceAmountUsed, setAdvanceAmountUsed] = useState(0);
  const [advanceInput, setAdvanceInput] = useState('');
  const [advanceBalance, setAdvanceBalance] = useState(0);

  const resetAdvance = () => {
    setAdvanceAmountUsed(0);
    setAdvanceInput('');
    setAdvanceBalance(0);
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

  const submitCreditWithCustomer = async (submitCreditFallback) => {
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
    submitCreditFallback?.(creditCustomer.selectedId, creditCustomer.selectedName);
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

  return {
    advanceAmountUsed,
    setAdvanceAmountUsed,
    advanceInput,
    setAdvanceInput,
    advanceBalance,
    resetAdvance,
    submitCreditWithCustomer,
    submitAdvanceAmount,
    submitFullAdvance,
  };
}

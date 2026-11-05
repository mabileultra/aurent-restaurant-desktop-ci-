import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { tenantBillingApi } from '../../../api';
import {
  formatMoneyInputDigits,
  parseMoneyInput,
} from '../utils/parseMoneyInput';

function invalidateBilling(qc) {
  qc.invalidateQueries({ queryKey: ['tenant-billing-me'] });
  qc.invalidateQueries({ queryKey: ['tenant-billing-topups'] });
  qc.invalidateQueries({ queryKey: ['tenant-billing-ledger'] });
  qc.invalidateQueries({ queryKey: ['tenant-billing-payments'] });
}

export function useTenantBillingTopUpForm({ onAmountChange } = {}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [amount, setAmountRaw] = useState(() => formatMoneyInputDigits('850000'));
  const [comment, setComment] = useState('');
  const [file, setFile] = useState(null);
  const [showManual, setShowManual] = useState(false);

  const parsedAmount = parseMoneyInput(amount);

  const setAmount = useCallback((value) => {
    setAmountRaw((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      return formatMoneyInputDigits(next);
    });
    onAmountChange?.();
  }, [onAmountChange]);

  const submitM = useMutation({
    mutationFn: () => {
      const value = parseMoneyInput(amount);
      if (value == null) {
        throw new Error(t('billing.invalidAmount'));
      }
      return tenantBillingApi.submitTopUp({
        amount: value,
        comment,
        file,
      });
    },
    onSuccess: () => {
      toast.success(t('billing.topUpSent'));
      setComment('');
      setFile(null);
      invalidateBilling(qc);
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('billing.topUpFailed')),
  });

  return {
    amount,
    setAmount,
    amountValid: parsedAmount != null,
    comment,
    setComment,
    file,
    setFile,
    showManual,
    setShowManual,
    submit: () => submitM.mutate(),
    submitting: submitM.isPending,
  };
}

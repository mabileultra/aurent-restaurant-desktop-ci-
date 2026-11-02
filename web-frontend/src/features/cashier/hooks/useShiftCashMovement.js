import { useState } from 'react';
import toast from 'react-hot-toast';
import { cashierShiftApi } from '../../../api/cashierShift.api';
import { fmtMoney } from '../../../utils/formatMoney';
import { useActionIdempotencyKey } from '../../../hooks/useActionIdempotencyKey';

export function useShiftCashMovement({
  direction = 'IN',
  shiftId,
  onSuccess,
  onClose,
  t,
}) {
  const { getHeaders, resetKey } = useActionIdempotencyKey();
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCashIn = direction === 'IN';
  const numericAmount = Math.max(0, Number(String(amountStr).replace(/\s+/g, '')) || 0);

  const handleAddQuickAmount = (delta) => {
    setAmountStr((prev) => {
      const current = Math.max(0, Number(String(prev).replace(/\s+/g, '')) || 0);
      return String(current + delta);
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!shiftId) {
      toast.error(t('pos.shiftRequired', { defaultValue: 'Faol smena topilmadi' }));
      return;
    }

    if (numericAmount <= 0) {
      toast.error(t('pos.cashMovementAmountRequired', { defaultValue: 'Iltimos, summani kiriting' }));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        amount: numericAmount,
        note: note.trim() || undefined,
      };

      const reqConfig = { headers: getHeaders() };
      if (isCashIn) {
        await cashierShiftApi.cashIn(shiftId, payload, reqConfig);
        toast.success(
          t('pos.cashInSuccess', {
            defaultValue: 'Kassaga {{amount}} so‘m kiritildi',
            amount: fmtMoney(numericAmount),
          })
        );
      } else {
        await cashierShiftApi.cashOut(shiftId, payload, reqConfig);
        toast.success(
          t('pos.cashOutSuccess', {
            defaultValue: 'Kassadan {{amount}} so‘m yechildi',
            amount: fmtMoney(numericAmount),
          })
        );
      }

      resetKey();
      onSuccess?.();
      onClose();
      setAmountStr('');
      setNote('');
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message || t('pos.cashMovementFailed', { defaultValue: 'Operatsiyani bajarib bo‘lmadi' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    amountStr,
    setAmountStr,
    note,
    setNote,
    isSubmitting,
    isCashIn,
    numericAmount,
    handleAddQuickAmount,
    handleSubmit,
  };
}

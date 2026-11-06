import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { cashierShiftApi } from '../../../api/cashierShift.api';
import { fmtMoney } from '../../../utils/formatMoney';
import { useActionIdempotencyKey } from '../../../hooks/useActionIdempotencyKey';

export function useShiftCashMovement({
  open = false,
  direction = 'IN',
  shiftId,
  onSuccess,
  onClose,
  t,
}) {
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCashIn = direction === 'IN';
  const numericAmount = Math.max(0, Number(String(amountStr).replace(/\s+/g, '')) || 0);

  // Modal ochiq bo'lsa yo'nalish, smena, summa va izoh bo'yicha imzo shakllanadi.
  // Ulardan biri o'zgarsa yoki modal yopilsa, Idempotency Key avtomatik bekor qilinadi.
  const payloadSignature = open
    ? `${direction}:${shiftId}:${numericAmount}:${note.trim()}`
    : null;

  const { getHeaders, resetKey } = useActionIdempotencyKey(payloadSignature);

  useEffect(() => {
    if (!open) {
      resetKey();
      setAmountStr('');
      setNote('');
    }
  }, [open, resetKey]);

  const handleClose = () => {
    resetKey();
    setAmountStr('');
    setNote('');
    onClose?.();
  };

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
      handleClose();
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
    handleClose,
  };
}

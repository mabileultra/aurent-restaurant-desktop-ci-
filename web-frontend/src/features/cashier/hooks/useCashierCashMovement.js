import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * Reusable hook for cashier cash movement (Kirim / Chiqim).
 * Shared between grocery POS and pharmacy POS to uphold DRY and SRP.
 */
export function useCashierCashMovement({ shiftIsOpen, storeId, t }) {
  const qc = useQueryClient();
  const [cashMovement, setCashMovement] = useState(null); // null | 'IN' | 'OUT'

  const handleCashIn = useCallback(() => {
    if (!shiftIsOpen) {
      toast.error(
        t('pos.shiftClosedForCashMovement', {
          defaultValue: 'Kirim qilish uchun smena ochiq bo‘lishi kerak',
        })
      );
      return;
    }
    setCashMovement('IN');
  }, [shiftIsOpen, t]);

  const handleCashOut = useCallback(() => {
    if (!shiftIsOpen) {
      toast.error(
        t('pos.shiftClosedForCashMovement', {
          defaultValue: 'Chiqim qilish uchun smena ochiq bo‘lishi kerak',
        })
      );
      return;
    }
    setCashMovement('OUT');
  }, [shiftIsOpen, t]);

  const handleCashMovementSuccess = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
    setCashMovement(null);
  }, [qc, storeId]);

  return {
    cashMovement,
    setCashMovement,
    handleCashIn,
    handleCashOut,
    handleCashMovementSuccess,
  };
}

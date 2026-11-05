import { useEffect, useState } from 'react';
import { useCashierShift } from './useCashierShift';
import { resolveStableShiftIsOpen } from './cashierShiftStability';

/**
 * Стабильный статус смены для кассы: не мигает Open/Close по stale-кэшу при refetch.
 * Пока идёт refetch — оставляем последнее подтверждённое значение.
 */
export function useCashierShiftView(storeId, { catalogKind } = {}) {
  const query = useCashierShift(storeId, { catalogKind });
  const {
    data: shift,
    isFetched: shiftFetched,
    isFetching: shiftFetching,
    isPending: shiftPending,
    error: shiftQueryError,
  } = query;

  const [shiftIsOpen, setShiftIsOpen] = useState(false);

  useEffect(() => {
    setShiftIsOpen((prev) =>
      resolveStableShiftIsOpen({
        previousIsOpen: prev,
        shiftFetching,
        shiftFetched,
        shiftStatus: shift?.status,
      }),
    );
  }, [shiftFetching, shiftFetched, shift?.status]);

  return {
    shift,
    shiftIsOpen,
    shiftFetched,
    shiftFetching,
    shiftPending,
    shiftQueryError,
    shiftReady: shiftFetched && !shiftFetching,
  };
}

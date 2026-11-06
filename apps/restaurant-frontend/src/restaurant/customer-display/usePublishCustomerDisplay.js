import { useEffect, useRef } from 'react';
import { buildCustomerDisplaySnapshot } from './buildCustomerDisplaySnapshot';
import { CFD_PHASE, idleSnapshot, publishCustomerDisplay } from './customerDisplayChannel';

const THANKS_HOLD_MS = 6_000;

function saleKey(sale) {
  if (!sale) return null;
  return String(sale.id ?? sale.saleId ?? sale.orderNo ?? sale.receiptNo ?? '');
}

/**
 * Cashier → guest display publisher. No-op when the module is off.
 */
export function usePublishCustomerDisplay({
  enabled,
  order,
  storeName,
  payModalOpen,
  payPending,
  paidSale,
}) {
  const thanksTimerRef = useRef(null);
  const thanksDoneKeyRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      publishCustomerDisplay(idleSnapshot(storeName));
      return undefined;
    }

    const key = saleKey(paidSale);
    if (!key) {
      thanksDoneKeyRef.current = null;
    }
    const saleForDisplay = key && key === thanksDoneKeyRef.current ? null : paidSale;

    const snapshot = buildCustomerDisplaySnapshot({
      order,
      storeName,
      payModalOpen,
      payPending,
      paidSale: saleForDisplay,
    });
    publishCustomerDisplay(snapshot);

    if (thanksTimerRef.current) {
      clearTimeout(thanksTimerRef.current);
      thanksTimerRef.current = null;
    }
    if (snapshot.phase === CFD_PHASE.THANKS && key) {
      thanksTimerRef.current = setTimeout(() => {
        thanksDoneKeyRef.current = key;
        publishCustomerDisplay(idleSnapshot(storeName));
      }, THANKS_HOLD_MS);
    }

    return () => {
      if (thanksTimerRef.current) {
        clearTimeout(thanksTimerRef.current);
        thanksTimerRef.current = null;
      }
    };
  }, [enabled, order, storeName, payModalOpen, payPending, paidSale]);
}

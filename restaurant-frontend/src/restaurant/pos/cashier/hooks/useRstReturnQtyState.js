import { useEffect, useMemo, useState } from 'react';
import {
  getReturnableLines,
  returnableQty,
  selectedReturnTotal,
} from '../utils/rstReturnLines';

/** Qty map for restaurant partial return modal. */
export function useRstReturnQtyState(sale, open) {
  const [qtyByItemId, setQtyByItemId] = useState({});

  useEffect(() => {
    if (!open) {
      setQtyByItemId({});
      return;
    }
    const next = {};
    getReturnableLines(sale).forEach((line) => {
      if (line.id) next[line.id] = 0;
    });
    setQtyByItemId(next);
  }, [open, sale?.id]);

  const setQty = (itemId, value) => {
    setQtyByItemId((prev) => ({ ...prev, [itemId]: value }));
  };

  const selectAllMax = () => {
    const next = {};
    getReturnableLines(sale).forEach((line) => {
      if (line.id) next[line.id] = returnableQty(line);
    });
    setQtyByItemId(next);
  };

  const totalSelected = useMemo(
    () => selectedReturnTotal(sale, qtyByItemId),
    [sale, qtyByItemId],
  );

  return { qtyByItemId, setQty, selectAllMax, totalSelected };
}

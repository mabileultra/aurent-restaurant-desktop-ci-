import { useCallback, useState } from 'react';
import {
  RECEIPT_LINES_COLUMN_DEFS,
  loadReceiptLinesColumns,
  saveReceiptLinesColumns,
} from '../utils/receiptLinesColumns';

export function useReceiptLinesColumns() {
  const [visible, setVisible] = useState(loadReceiptLinesColumns);

  const toggleColumn = useCallback((id) => {
    const def = RECEIPT_LINES_COLUMN_DEFS.find((c) => c.id === id);
    if (!def || def.locked) return;
    setVisible((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveReceiptLinesColumns(next);
      return next;
    });
  }, []);

  return {
    columnDefs: RECEIPT_LINES_COLUMN_DEFS,
    visible,
    visibleDefs: RECEIPT_LINES_COLUMN_DEFS.filter((c) => visible[c.id]),
    toggleColumn,
  };
}

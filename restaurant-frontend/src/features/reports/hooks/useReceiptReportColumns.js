import { useCallback, useState } from 'react';
import {
  RECEIPT_REPORT_COLUMN_DEFS,
  loadReceiptReportColumns,
  saveReceiptReportColumns,
} from '../utils/receiptReportColumns';

export function useReceiptReportColumns() {
  const [visible, setVisible] = useState(loadReceiptReportColumns);

  const toggleColumn = useCallback((id) => {
    const def = RECEIPT_REPORT_COLUMN_DEFS.find((c) => c.id === id);
    if (!def || def.locked) return;
    setVisible((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveReceiptReportColumns(next);
      return next;
    });
  }, []);

  return {
    columnDefs: RECEIPT_REPORT_COLUMN_DEFS,
    visible,
    visibleDefs: RECEIPT_REPORT_COLUMN_DEFS.filter((c) => visible[c.id]),
    toggleColumn,
  };
}

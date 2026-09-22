export const RECEIPT_REPORT_COLUMNS_KEY = 'rst.receiptReport.visibleColumns.v1';

export const RECEIPT_REPORT_COLUMN_DEFS = [
  { id: 'no', labelKey: 'common.colNo', locked: true },
  { id: 'receiptNo', labelKey: 'stockReports.colReceiptNo', locked: true },
  { id: 'date', labelKey: 'stockReports.colDate' },
  { id: 'supplier', labelKey: 'stockReports.colSupplier' },
  { id: 'qty', labelKey: 'stockReports.colQty', numeric: true },
  { id: 'amount', labelKey: 'stockReports.colAmount', numeric: true },
];

const DEFAULT = {
  no: true,
  receiptNo: true,
  date: true,
  supplier: true,
  qty: true,
  amount: true,
};

export function loadReceiptReportColumns() {
  try {
    const raw = localStorage.getItem(RECEIPT_REPORT_COLUMNS_KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw), no: true, receiptNo: true };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveReceiptReportColumns(next) {
  try {
    localStorage.setItem(RECEIPT_REPORT_COLUMNS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

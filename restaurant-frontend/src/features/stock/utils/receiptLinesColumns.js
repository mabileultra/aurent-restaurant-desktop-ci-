export const RECEIPT_LINES_COLUMNS_KEY = 'rst.receiptLines.visibleColumns.v1';

export const RECEIPT_LINES_COLUMN_DEFS = [
  { id: 'no', labelKey: 'common.colNo', locked: true },
  { id: 'product', labelKey: 'stockReports.pickProduct', locked: true },
  { id: 'qty', labelKey: 'stockReports.colQty' },
  { id: 'buy', labelKey: 'stockReports.purchasePrice' },
  { id: 'sale', labelKey: 'stockReports.salePrice' },
];

const DEFAULT = {
  no: true,
  product: true,
  qty: true,
  buy: true,
  sale: true,
};

export function loadReceiptLinesColumns() {
  try {
    const raw = localStorage.getItem(RECEIPT_LINES_COLUMNS_KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw), no: true, product: true };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveReceiptLinesColumns(next) {
  try {
    localStorage.setItem(RECEIPT_LINES_COLUMNS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

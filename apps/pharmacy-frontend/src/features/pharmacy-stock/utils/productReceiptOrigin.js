/** Keys must match pharmacy ProductReceiptOriginAttrs. */

export const RECEIPT_ORIGIN = {
  receiptId: 'receipt.id',
  receiptNumber: 'receipt.number',
  supplierId: 'receipt.supplierId',
  supplierName: 'receipt.supplierName',
  documentDate: 'receipt.documentDate',
};

export function productReceiptOrigin(product) {
  const attrs = product?.attributes || {};
  return {
    receiptId: attrs[RECEIPT_ORIGIN.receiptId] || null,
    receiptNumber: attrs[RECEIPT_ORIGIN.receiptNumber] || null,
    supplierId: attrs[RECEIPT_ORIGIN.supplierId] || null,
    supplierName: attrs[RECEIPT_ORIGIN.supplierName] || null,
    documentDate: attrs[RECEIPT_ORIGIN.documentDate] || null,
  };
}

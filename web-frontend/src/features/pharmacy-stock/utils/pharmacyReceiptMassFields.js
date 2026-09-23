/** Поля массового изменения строк прихода. */
export const PHARM_RECEIPT_MASS_FIELDS = [
  { id: 'QUANTITY', label: 'pharmacyStock.colQty', kind: 'number' },
  { id: 'UNITS_IN_PACK', label: 'pharmacyStock.unitsInPack', kind: 'number' },
  { id: 'PURCHASE', label: 'pharmacyStock.purchasePrice', kind: 'number' },
  { id: 'VAT', label: 'pharmacyStock.vatRate', kind: 'number' },
  { id: 'MARKUP', label: 'pharmacyStock.markupPercent', kind: 'number' },
  { id: 'RETAIL', label: 'pharmacyStock.retailPrice', kind: 'number' },
  { id: 'BATCH', label: 'pharmacyStock.batch', kind: 'text' },
  { id: 'EXPIRY', label: 'pharmacyStock.expiry', kind: 'date' },
];

export const PHARM_RECEIPT_MASS_NUMERIC = new Set([
  'QUANTITY',
  'UNITS_IN_PACK',
  'PURCHASE',
  'VAT',
  'MARKUP',
  'RETAIL',
]);

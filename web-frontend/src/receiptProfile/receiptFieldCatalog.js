/**
 * Company-scoped fiscal receipt field catalog (per client).
 * New “moments” on the slip = new key here + default; printers merge unknowns as on.
 */

export const RECEIPT_PROFILE_VERSION = 1;

/** Document kinds that will share this catalog (print path reads by doc + key). */
export const RECEIPT_DOC = Object.freeze({
  FISCAL_SALE: 'FISCAL_SALE',
  SHIFT_REPORT: 'SHIFT_REPORT',
  Z_REPORT: 'Z_REPORT',
});

export const RECEIPT_FIELD_DEFS = Object.freeze([
  { key: 'logo', labelKey: 'tenantSettings.receiptFields.logo' },
  { key: 'companyName', labelKey: 'tenantSettings.receiptFields.companyName' },
  { key: 'companyAddress', labelKey: 'tenantSettings.receiptFields.companyAddress' },
  { key: 'companyPhone', labelKey: 'tenantSettings.receiptFields.companyPhone' },
  { key: 'stir', labelKey: 'tenantSettings.receiptFields.stir' },
  { key: 'dateTime', labelKey: 'tenantSettings.receiptFields.dateTime' },
  { key: 'receiptNo', labelKey: 'tenantSettings.receiptFields.receiptNo' },
  { key: 'receiptType', labelKey: 'tenantSettings.receiptFields.receiptType' },
  { key: 'employee', labelKey: 'tenantSettings.receiptFields.employee' },
  { key: 'shift', labelKey: 'tenantSettings.receiptFields.shift' },
  { key: 'items', labelKey: 'tenantSettings.receiptFields.items' },
  { key: 'itemIkpu', labelKey: 'tenantSettings.receiptFields.itemIkpu' },
  { key: 'itemVatLine', labelKey: 'tenantSettings.receiptFields.itemVatLine' },
  { key: 'discounts', labelKey: 'tenantSettings.receiptFields.discounts' },
  { key: 'grandTotal', labelKey: 'tenantSettings.receiptFields.grandTotal' },
  { key: 'vatTotal', labelKey: 'tenantSettings.receiptFields.vatTotal' },
  { key: 'payment', labelKey: 'tenantSettings.receiptFields.payment' },
  { key: 'fiscalBlock', labelKey: 'tenantSettings.receiptFields.fiscalBlock' },
  { key: 'qrCode', labelKey: 'tenantSettings.receiptFields.qrCode' },
  { key: 'footer', labelKey: 'tenantSettings.receiptFields.footer' },
]);

export function defaultReceiptFieldMap() {
  return Object.fromEntries(RECEIPT_FIELD_DEFS.map((d) => [d.key, true]));
}

/** Merge saved company map; unknown keys ignored; missing keys → on. */
export function mergeReceiptFields(saved) {
  const base = defaultReceiptFieldMap();
  if (!saved || typeof saved !== 'object') return base;
  for (const d of RECEIPT_FIELD_DEFS) {
    if (typeof saved[d.key] === 'boolean') base[d.key] = saved[d.key];
  }
  return base;
}

export function isReceiptFieldOn(fields, key) {
  if (!key) return true;
  if (!fields || typeof fields !== 'object') return true;
  return fields[key] !== false;
}

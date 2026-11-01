/**
 * Company-scoped fiscal receipt field catalog (per client).
 * controls: which style knobs apply (size%/bold%/align) — not every block gets %.
 */

export const RECEIPT_PROFILE_VERSION = 1;

export const RECEIPT_DOC = Object.freeze({
  FISCAL_SALE: 'FISCAL_SALE',
  SHIFT_REPORT: 'SHIFT_REPORT',
  Z_REPORT: 'Z_REPORT',
});

/** @type {ReadonlyArray<{ key: string, labelKey: string, controls: { size: boolean, bold: boolean, align: boolean }, defaultAlign?: string }>} */
export const RECEIPT_FIELD_DEFS = Object.freeze([
  {
    key: 'logo',
    labelKey: 'tenantSettings.receiptFields.logo',
    controls: { size: false, bold: false, align: true },
    defaultAlign: 'center',
  },
  {
    key: 'companyName',
    labelKey: 'tenantSettings.receiptFields.companyName',
    controls: { size: true, bold: true, align: true },
    defaultAlign: 'center',
  },
  {
    key: 'companyAddress',
    labelKey: 'tenantSettings.receiptFields.companyAddress',
    controls: { size: true, bold: true, align: true },
    defaultAlign: 'center',
  },
  {
    key: 'companyPhone',
    labelKey: 'tenantSettings.receiptFields.companyPhone',
    controls: { size: true, bold: true, align: true },
    defaultAlign: 'center',
  },
  {
    key: 'stir',
    labelKey: 'tenantSettings.receiptFields.stir',
    controls: { size: true, bold: true, align: true },
    defaultAlign: 'center',
  },
  {
    key: 'dateTime',
    labelKey: 'tenantSettings.receiptFields.dateTime',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'receiptNo',
    labelKey: 'tenantSettings.receiptFields.receiptNo',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'receiptType',
    labelKey: 'tenantSettings.receiptFields.receiptType',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'employee',
    labelKey: 'tenantSettings.receiptFields.employee',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'shift',
    labelKey: 'tenantSettings.receiptFields.shift',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'items',
    labelKey: 'tenantSettings.receiptFields.items',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'itemIkpu',
    labelKey: 'tenantSettings.receiptFields.itemIkpu',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'itemVatLine',
    labelKey: 'tenantSettings.receiptFields.itemVatLine',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'service',
    labelKey: 'tenantSettings.receiptFields.service',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'discounts',
    labelKey: 'tenantSettings.receiptFields.discounts',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'grandTotal',
    labelKey: 'tenantSettings.receiptFields.grandTotal',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'vatTotal',
    labelKey: 'tenantSettings.receiptFields.vatTotal',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'payment',
    labelKey: 'tenantSettings.receiptFields.payment',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'fiscalBlock',
    labelKey: 'tenantSettings.receiptFields.fiscalBlock',
    controls: { size: true, bold: true, align: true },
  },
  {
    key: 'qrCode',
    labelKey: 'tenantSettings.receiptFields.qrCode',
    controls: { size: false, bold: false, align: true },
    defaultAlign: 'center',
  },
  {
    key: 'footer',
    labelKey: 'tenantSettings.receiptFields.footer',
    controls: { size: true, bold: true, align: true },
    defaultAlign: 'center',
  },
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

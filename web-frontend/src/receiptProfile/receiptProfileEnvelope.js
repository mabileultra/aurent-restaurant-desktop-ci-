import {
  RECEIPT_PROFILE_VERSION,
  defaultReceiptFieldMap,
  mergeReceiptFields,
} from './receiptFieldCatalog';

/**
 * Envelope stored inside company_tenant_display_settings (and future uiTheme).
 * Keep uiTheme null until theme UI ships — printers ignore it.
 */
export function emptyReceiptProfileEnvelope() {
  return {
    version: RECEIPT_PROFILE_VERSION,
    receiptFields: defaultReceiptFieldMap(),
    uiTheme: null,
  };
}

export function mergeReceiptProfileEnvelope(partial) {
  const p = partial && typeof partial === 'object' ? partial : {};
  return {
    version: Number(p.version) > 0 ? Number(p.version) : RECEIPT_PROFILE_VERSION,
    receiptFields: mergeReceiptFields(p.receiptFields),
    uiTheme: p.uiTheme && typeof p.uiTheme === 'object' ? p.uiTheme : null,
  };
}

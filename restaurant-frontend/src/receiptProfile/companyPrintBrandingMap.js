/**
 * Company fiscal receiptFields ↔ store printProfile branding keys.
 * Kitchen/guest slips stay store-scoped; empty store branding can inherit company.
 */

export const COMPANY_TO_PRINT_BRANDING = Object.freeze({
  logo: 'logo',
  companyName: 'storeName',
  companyAddress: 'address',
  companyPhone: 'phone',
  footer: 'footer',
});

export const PRINT_TO_COMPANY_FIELD = Object.freeze(
  Object.fromEntries(
    Object.entries(COMPANY_TO_PRINT_BRANDING).map(([companyKey, printKey]) => [printKey, companyKey]),
  ),
);

/** Slips that may inherit company branding when store text is empty. */
export const BRANDING_INHERIT_SLIPS = Object.freeze(['GUEST_BILL', 'KITCHEN', 'CANCEL', 'SHIFT_ITEMS']);

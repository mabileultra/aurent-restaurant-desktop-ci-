import { COMPANY_TO_PRINT_BRANDING } from '../../../receiptProfile/companyPrintBrandingMap';
import { factoryPrintProfile } from './printProfileDefaults';

function companyFieldOn(fields, key) {
  return !fields || fields[key] !== false;
}

/**
 * Empty store branding ← company tenant display (fiscal settings).
 * Guest-bill toggles follow company on/off for the mapped keys when text exists.
 */
export function enrichPrintProfileFromCompany(profile, companyCommitted) {
  const base = profile && typeof profile === 'object' ? profile : factoryPrintProfile();
  const d = companyCommitted || {};
  const fields = d.receiptFields || {};
  const next = {
    ...base,
    slips: { ...(base.slips || {}) },
  };

  const logo = String(d.receiptLogoDataUrl || '').trim();
  const name = String(d.receiptCompanyName || '').trim();
  const address = String(d.receiptCompanyAddress || '').trim();
  const phone = String(d.receiptCompanyPhone || '').trim();
  const logoH = Number(d.receiptLogoMaxHeightMm) || 0;

  if (!String(next.logoDataUrl || '').trim() && logo && companyFieldOn(fields, 'logo')) {
    next.logoDataUrl = logo;
    if (logoH > 0) next.logoMaxHeightMm = logoH;
  }
  if (!String(next.storeName || '').trim() && name && companyFieldOn(fields, 'companyName')) {
    next.storeName = name;
  }
  if (!String(next.address || '').trim() && address && companyFieldOn(fields, 'companyAddress')) {
    next.address = address;
  }
  if (!String(next.phone || '').trim() && phone && companyFieldOn(fields, 'companyPhone')) {
    next.phone = phone;
  }

  const guest = { ...(next.slips.GUEST_BILL || {}) };
  const guestFields = { ...(guest.fields || {}) };
  for (const [companyKey, printKey] of Object.entries(COMPANY_TO_PRINT_BRANDING)) {
    if (companyKey === 'footer') continue;
    const hasText = printKey === 'logo'
      ? Boolean(String(next.logoDataUrl || '').trim())
      : Boolean(String(next[printKey] || '').trim());
    if (!hasText) continue;
    const cur = { ...(guestFields[printKey] || {}) };
    guestFields[printKey] = {
      ...cur,
      on: companyFieldOn(fields, companyKey),
      bold: cur.bold ?? false,
      size: cur.size || 'md',
      font: cur.font || 'inherit',
    };
  }
  guest.fields = guestFields;
  next.slips = { ...next.slips, GUEST_BILL: guest };
  return next;
}

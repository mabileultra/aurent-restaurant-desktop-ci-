import { footerLines, headerValue, plainSlipLine, slipFieldStyle } from './applyPrintProfile';

const SLIP = 'GUEST_BILL';

function enabledText(profile, key) {
  const style = slipFieldStyle(profile, SLIP, key);
  if (!style.on) return '';
  return headerValue(profile, key);
}

/**
 * Filled logo, name, phone, address and footer go on the fiscal check.
 * An empty profile leaves the cashier receipt payload unchanged.
 */
export function applyGuestBillToFiscalPayload(payload, profile) {
  if (!payload || !profile) return payload;
  const branding = { ...(payload.branding || {}) };
  const receiptFields = { ...(payload.receiptFields || {}) };
  const labels = { ...(payload.labels || {}) };

  const logoOn = slipFieldStyle(profile, SLIP, 'logo').on && headerValue(profile, 'logo');
  if (logoOn) {
    branding.logoDataUrl = profile.logoDataUrl;
    branding.logoMaxHeightMm = Number(profile.logoMaxHeightMm) || 22;
    receiptFields.logo = true;
  }
  const storeName = enabledText(profile, 'storeName');
  if (storeName) {
    branding.companyName = storeName;
    receiptFields.companyName = true;
  }
  const address = enabledText(profile, 'address');
  if (address) {
    branding.companyAddress = address;
    receiptFields.companyAddress = true;
  }
  const phone = enabledText(profile, 'phone');
  if (phone) {
    branding.companyPhone = phone;
    receiptFields.companyPhone = true;
  }
  const foot = footerLines(profile, SLIP);
  if (foot.length) {
    receiptFields.footer = true;
    labels.footer = plainSlipLine(foot[0]);
  }

  return { ...payload, branding, receiptFields, labels };
}

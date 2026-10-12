import { footerLines, plainSlipLine } from './applyPrintProfile';
import { fieldStyle } from './printProfileDefaults';

const SLIP = 'GUEST_BILL';

function enabledText(profile, key) {
  const style = fieldStyle(profile, SLIP, key);
  if (!style.on) return '';
  return String(profile?.[key] || '').trim();
}

/**
 * Restaurant print profile overrides the fiscal header only when that slip field is on.
 * Default profile (branding off) leaves the cashier receipt payload unchanged.
 */
export function applyGuestBillToFiscalPayload(payload, profile) {
  if (!payload || !profile) return payload;
  const branding = { ...(payload.branding || {}) };
  const receiptFields = { ...(payload.receiptFields || {}) };
  const labels = { ...(payload.labels || {}) };

  const logoOn = fieldStyle(profile, SLIP, 'logo').on && String(profile.logoDataUrl || '').trim();
  if (logoOn) {
    branding.logoDataUrl = profile.logoDataUrl;
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

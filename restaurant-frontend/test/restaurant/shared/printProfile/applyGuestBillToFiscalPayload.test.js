import { describe, expect, it } from 'vitest';
import { applyGuestBillToFiscalPayload } from '../../../../src/restaurant/shared/printProfile/applyGuestBillToFiscalPayload';
import { factoryPrintProfile } from '../../../../src/restaurant/shared/printProfile/printProfileDefaults';

const payload = {
  branding: { companyName: 'Tenant', companyPhone: '', logoDataUrl: null },
  receiptFields: { logo: false, companyPhone: false, footer: false },
  labels: { footer: '' },
};

describe('applyGuestBillToFiscalPayload', () => {
  it('leaves the fiscal payload alone when the header is empty', () => {
    const profile = factoryPrintProfile();
    const next = applyGuestBillToFiscalPayload(payload, profile);
    expect(next.branding.companyPhone).toBe('');
    expect(next.branding.logoDataUrl).toBeNull();
    expect(next.receiptFields.footer).toBe(false);
    expect(next.labels.footer).toBe('');
    expect(next.branding.companyName).toBe('Tenant');
  });

  it('copies a filled header onto the fiscal check even if the guest-bill boxes are off', () => {
    const profile = factoryPrintProfile();
    profile.storeName = 'XAN BALIQ';
    profile.phone = '+998';
    profile.address = 'Ташкент';
    profile.logoDataUrl = 'data:image/png;base64,xx';
    profile.footer = 'Ждём снова';
    const next = applyGuestBillToFiscalPayload(payload, profile);
    expect(next.branding.companyName).toBe('XAN BALIQ');
    expect(next.branding.companyPhone).toBe('+998');
    expect(next.branding.companyAddress).toBe('Ташкент');
    expect(next.branding.logoDataUrl).toBe('data:image/png;base64,xx');
    expect(next.receiptFields.logo).toBe(true);
    expect(next.receiptFields.companyPhone).toBe(true);
    expect(next.receiptFields.companyAddress).toBe(true);
    expect(next.receiptFields.footer).toBe(true);
    expect(next.labels.footer).toBe('Ждём снова');
  });

  it('copies logo, phone and footer when the guest-bill toggles are on', () => {
    const profile = factoryPrintProfile();
    profile.phone = '+998 90';
    profile.logoDataUrl = 'data:image/png;base64,xx';
    profile.footer = 'Ждём снова';
    profile.slips.GUEST_BILL.fields.phone.on = true;
    profile.slips.GUEST_BILL.fields.logo.on = true;
    profile.slips.GUEST_BILL.fields.footer.on = true;
    const next = applyGuestBillToFiscalPayload(payload, profile);
    expect(next.branding.companyPhone).toBe('+998 90');
    expect(next.branding.logoDataUrl).toBe('data:image/png;base64,xx');
    expect(next.receiptFields.logo).toBe(true);
    expect(next.receiptFields.companyPhone).toBe(true);
    expect(next.receiptFields.footer).toBe(true);
    expect(next.labels.footer).toBe('Ждём снова');
    expect(next.branding.companyName).toBe('Tenant');
  });
});

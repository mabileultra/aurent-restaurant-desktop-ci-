import { describe, expect, it } from 'vitest';
import {
  brandingLines,
  footerLines,
  guestBillScreenHeader,
  styleDishLine,
  ticketPrintOptions,
  wrapSlipLines,
} from '../../../../src/restaurant/shared/printProfile/applyPrintProfile';
import { factoryPrintProfile } from '../../../../src/restaurant/shared/printProfile/printProfileDefaults';
import { EMPH_LINE_PREFIX } from '../../../../src/restaurant/pos/utils/ticketLayout';

describe('applyPrintProfile defaults', () => {
  it('does not inject branding lines by default', () => {
    const profile = factoryPrintProfile();
    profile.storeName = 'Rayhon';
    expect(brandingLines(profile, 'CANCEL')).toEqual([]);
  });

  it('keeps cancel dish lines emphasized like today', () => {
    const profile = factoryPrintProfile();
    const row = styleDishLine('Лагман          ×2', profile, 'CANCEL');
    expect(row.startsWith(EMPH_LINE_PREFIX)).toBe(true);
  });

  it('leaves kitchen dish lines plain by default', () => {
    const profile = factoryPrintProfile();
    const row = styleDishLine('Лагман          ×2', profile, 'KITCHEN');
    expect(row.startsWith(EMPH_LINE_PREFIX)).toBe(false);
    expect(row).toBe('Лагман          ×2');
  });

  it('logo off by default in ticket options', () => {
    const profile = factoryPrintProfile();
    profile.logoDataUrl = 'data:image/png;base64,xx';
    expect(ticketPrintOptions(profile, 'CANCEL').logoDataUrl).toBe('');
  });

  it('legacy guest bill auto-prints filled header when schemaVersion < 2', () => {
    const profile = factoryPrintProfile();
    profile.schemaVersion = 1;
    profile.storeName = 'XAN BALIQ';
    profile.phone = '+998 90 000 00 00';
    profile.footer = 'Ждём снова';
    profile.logoDataUrl = 'data:image/png;base64,xx';
    expect(brandingLines(profile, 'CANCEL')).toEqual([]);
    expect(ticketPrintOptions(profile, 'CANCEL').logoDataUrl).toBe('');
    expect(brandingLines(profile, 'GUEST_BILL')).toEqual(['XAN BALIQ', '+998 90 000 00 00']);
    expect(footerLines(profile, 'GUEST_BILL')).toEqual(['Ждём снова']);
    expect(ticketPrintOptions(profile, 'GUEST_BILL').logoDataUrl).toBe('data:image/png;base64,xx');
    expect(guestBillScreenHeader(profile)).toMatchObject({
      companyName: 'XAN BALIQ',
      companyPhone: '+998 90 000 00 00',
      logoDataUrl: 'data:image/png;base64,xx',
      footer: 'Ждём снова',
    });
    expect(wrapSlipLines(['тело'], profile, 'GUEST_BILL')).toEqual([
      'XAN BALIQ',
      '+998 90 000 00 00',
      'тело',
      'Ждём снова',
    ]);
  });

  it('schema v2 guest bill respects header toggles', () => {
    const profile = factoryPrintProfile();
    profile.schemaVersion = 2;
    profile.storeName = 'XAN BALIQ';
    profile.phone = '+998 90 000 00 00';
    profile.slips.GUEST_BILL.fields.storeName.on = true;
    profile.slips.GUEST_BILL.fields.phone.on = false;
    expect(brandingLines(profile, 'GUEST_BILL')).toEqual(['XAN BALIQ']);
  });
});

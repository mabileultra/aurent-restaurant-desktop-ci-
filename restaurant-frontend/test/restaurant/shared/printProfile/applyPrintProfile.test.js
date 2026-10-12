import { describe, expect, it } from 'vitest';
import {
  brandingLines,
  footerLines,
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

  it('prints phone and footer only after the slip toggles are on', () => {
    const profile = factoryPrintProfile();
    profile.phone = '+998 90 000 00 00';
    profile.footer = 'Ждём снова';
    expect(wrapSlipLines(['тело'], profile, 'GUEST_BILL')).toEqual(['тело']);

    profile.slips.GUEST_BILL.fields.phone.on = true;
    profile.slips.GUEST_BILL.fields.footer.on = true;
    expect(brandingLines(profile, 'GUEST_BILL')).toEqual(['+998 90 000 00 00']);
    expect(footerLines(profile, 'GUEST_BILL')).toEqual(['Ждём снова']);
    expect(wrapSlipLines(['тело'], profile, 'GUEST_BILL')).toEqual([
      '+998 90 000 00 00',
      'тело',
      'Ждём снова',
    ]);
  });
});

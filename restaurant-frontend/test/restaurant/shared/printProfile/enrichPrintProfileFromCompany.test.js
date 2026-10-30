import { describe, expect, it } from 'vitest';
import { enrichPrintProfileFromCompany } from '../../../../src/restaurant/shared/printProfile/enrichPrintProfileFromCompany';
import { factoryPrintProfile } from '../../../../src/restaurant/shared/printProfile/printProfileDefaults';
import { brandingLines } from '../../../../src/restaurant/shared/printProfile/applyPrintProfile';

describe('enrichPrintProfileFromCompany', () => {
  it('fills empty store branding from company', () => {
    const profile = factoryPrintProfile();
    const next = enrichPrintProfileFromCompany(profile, {
      receiptCompanyName: 'Rayhon',
      receiptCompanyPhone: '+998',
      receiptFields: { companyName: true, companyPhone: true, logo: true },
    });
    expect(next.storeName).toBe('Rayhon');
    expect(next.phone).toBe('+998');
    expect(next.slips.GUEST_BILL.fields.storeName.on).toBe(true);
    expect(next.slips.GUEST_BILL.fields.phone.on).toBe(true);
  });

  it('does not overwrite store text', () => {
    const profile = factoryPrintProfile();
    profile.storeName = 'Local Hall';
    const next = enrichPrintProfileFromCompany(profile, {
      receiptCompanyName: 'Cloud Name',
      receiptFields: { companyName: true },
    });
    expect(next.storeName).toBe('Local Hall');
  });

  it('schema v2 respects guest-bill toggle off even with text', () => {
    const profile = factoryPrintProfile();
    profile.schemaVersion = 2;
    profile.storeName = 'Hidden';
    profile.slips.GUEST_BILL.fields.storeName.on = false;
    expect(brandingLines(profile, 'GUEST_BILL')).toEqual([]);
  });
});

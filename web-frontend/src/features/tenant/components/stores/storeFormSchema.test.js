import { describe, expect, it } from 'vitest';
import { buildStoreFormSchema, buildStoreSubmitPayload } from './storeFormSchema';

describe('storeFormSchema', () => {
  const t = (k, opts) => opts?.defaultValue || k;

  it('validates required name field', () => {
    const schema = buildStoreFormSchema(t, { isCreate: true, showCompanySelect: false });
    const res = schema.safeParse({
      name: '',
      businessType: 'RESTAURANT',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
    });
    expect(res.success).toBe(false);
  });

  it('requires both region and district if one is provided', () => {
    const schema = buildStoreFormSchema(t, { isCreate: false, showCompanySelect: false });
    const res = schema.safeParse({
      name: 'Test Store',
      businessType: 'RESTAURANT',
      regionCode: 'UZ-TO',
      districtCode: '',
    });
    expect(res.success).toBe(false);
  });

  it('builds submit payload cleanly with formatted phone', () => {
    const data = {
      name: '  Markaziy Filial  ',
      address: ' Navoiy ko‘chasi 10 ',
      phone: '+998 90 123 45 67',
      code: ' F-01 ',
      companyId: '42',
      businessType: 'RESTAURANT',
      businessTypeId: '5',
      active: true,
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
    };
    const payload = buildStoreSubmitPayload(data, true);
    expect(payload.name).toBe('Markaziy Filial');
    expect(payload.address).toBe('Navoiy ko‘chasi 10');
    expect(payload.companyId).toBe(42);
    expect(payload.businessTypeId).toBe(5);
    expect(payload.phone).toBe('+998 (90) 123-45-67');
    expect(payload.code).toBe('F-01');
    expect(payload.regionCode).toBe('UZ-TO');
    expect(payload.districtCode).toBe('UZ-TO-01');
    expect(payload.active).toBe(true);
  });
});

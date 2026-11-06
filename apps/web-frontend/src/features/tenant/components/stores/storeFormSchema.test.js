import { describe, expect, it } from 'vitest';
import {
  buildStoreFormSchema,
  buildStoreSubmitPayload,
  findDuplicateStoreName,
} from './storeFormSchema';

describe('storeFormSchema', () => {
  const t = (k, opts) => opts?.defaultValue || k;

  it('validates required and trimmed name field', () => {
    const schema = buildStoreFormSchema(t, { isCreate: true, showCompanySelect: false });

    // Empty name
    const emptyRes = schema.safeParse({
      name: '',
      phone: '+998 90 123 45 67',
      businessType: 'RESTAURANT',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
    });
    expect(emptyRes.success).toBe(false);

    // Whitespace only name
    const wsRes = schema.safeParse({
      name: '   ',
      phone: '+998 90 123 45 67',
      businessType: 'RESTAURANT',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
    });
    expect(wsRes.success).toBe(false);

    // 1 char name
    const shortRes = schema.safeParse({
      name: 'A',
      phone: '+998 90 123 45 67',
      businessType: 'RESTAURANT',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
    });
    expect(shortRes.success).toBe(false);

    // Valid 2+ char name
    const validRes = schema.safeParse({
      name: 'Filial 1',
      phone: '+998 90 123 45 67',
      businessType: 'RESTAURANT',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
    });
    expect(validRes.success).toBe(true);
  });

  it('strictly requires phone in creation mode (!isCreate)', () => {
    const schema = buildStoreFormSchema(t, { isCreate: true, showCompanySelect: false });

    // Missing/empty phone
    const emptyPhone = schema.safeParse({
      name: 'Test Store',
      phone: '',
      businessType: 'RESTAURANT',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
    });
    expect(emptyPhone.success).toBe(false);

    // Only prefix '+998 '
    const prefixOnlyPhone = schema.safeParse({
      name: 'Test Store',
      phone: '+998 ',
      businessType: 'RESTAURANT',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
    });
    expect(prefixOnlyPhone.success).toBe(false);

    // Incomplete phone
    const partialPhone = schema.safeParse({
      name: 'Test Store',
      phone: '+998 90 12',
      businessType: 'RESTAURANT',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
    });
    expect(partialPhone.success).toBe(false);

    // Complete phone
    const fullPhone = schema.safeParse({
      name: 'Test Store',
      phone: '+998 90 123 45 67',
      businessType: 'RESTAURANT',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
    });
    expect(fullPhone.success).toBe(true);
  });

  it('allows empty phone in edit mode (isCreate=false), but validates format if provided', () => {
    const schema = buildStoreFormSchema(t, { isCreate: false, showCompanySelect: false });

    // Empty phone allowed on edit
    const emptyPhone = schema.safeParse({
      name: 'Test Store',
      phone: '',
      businessType: 'RESTAURANT',
    });
    expect(emptyPhone.success).toBe(true);

    // Incomplete phone still rejected on edit
    const partialPhone = schema.safeParse({
      name: 'Test Store',
      phone: '+998 90 12',
      businessType: 'RESTAURANT',
    });
    expect(partialPhone.success).toBe(false);

    // Complete phone passes
    const fullPhone = schema.safeParse({
      name: 'Test Store',
      phone: '+998 90 123 45 67',
      businessType: 'RESTAURANT',
    });
    expect(fullPhone.success).toBe(true);
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

  it('requires companyId when showCompanySelect is true', () => {
    const schema = buildStoreFormSchema(t, { isCreate: true, showCompanySelect: true });
    const withoutCompany = schema.safeParse({
      name: 'Test Store',
      phone: '+998 90 123 45 67',
      businessType: 'RESTAURANT',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
      companyId: '',
    });
    expect(withoutCompany.success).toBe(false);

    const withCompany = schema.safeParse({
      name: 'Test Store',
      phone: '+998 90 123 45 67',
      businessType: 'RESTAURANT',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
      companyId: '10',
    });
    expect(withCompany.success).toBe(true);
  });

  it('detects duplicate store names within the same company', () => {
    const stores = [
      { id: 1, companyId: 5, name: 'Chilonzor' },
      { id: 2, companyId: 5, name: 'Yunusobod' },
      { id: 3, companyId: 6, name: 'Chilonzor' },
    ];

    // Same name, same company -> duplicate
    expect(
      findDuplicateStoreName(stores, { name: '  chilonzor ', companyId: '5' })
    ).toBeTruthy();

    // Same name, excluding self -> NOT duplicate
    expect(
      findDuplicateStoreName(stores, { name: 'Chilonzor', companyId: '5', excludeId: 1 })
    ).toBeUndefined();

    // Same name, different company -> NOT duplicate
    expect(
      findDuplicateStoreName(stores, { name: 'Yunusobod', companyId: '6' })
    ).toBeUndefined();
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

  it('sends empty string on edit when address or phone is cleared so backend clears fields', () => {
    const data = {
      name: 'Filial 1',
      address: '   ',
      phone: '',
      businessType: 'RETAIL',
    };
    const payloadUpdate = buildStoreSubmitPayload(data, false);
    expect(payloadUpdate.address).toBe('');
    expect(payloadUpdate.phone).toBe('');

    const payloadCreate = buildStoreSubmitPayload(data, true);
    expect(payloadCreate.address).toBeNull();
    expect(payloadCreate.phone).toBeNull();
  });
});

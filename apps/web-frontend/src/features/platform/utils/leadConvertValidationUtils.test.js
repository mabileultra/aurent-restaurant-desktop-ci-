import { describe, it, expect } from 'vitest';
import { validateCompanyConvertForm, TIN_LENGTH } from './leadConvertValidationUtils';

describe('leadConvertValidationUtils', () => {
  it('identifies missing company name', () => {
    const res = validateCompanyConvertForm({
      companyName: '',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
    });
    expect(res.isCompanyNameValid).toBe(false);
    expect(res.canSubmit).toBe(false);
    expect(res.validationHint).toBe('Kompaniya nomini kiriting');
  });

  it('identifies missing region or district code', () => {
    const resNoRegion = validateCompanyConvertForm({
      companyName: 'Akfa Imzo',
      regionCode: '',
      districtCode: 'UZ-TO-01',
    });
    expect(resNoRegion.isGeoValid).toBe(false);
    expect(resNoRegion.canSubmit).toBe(false);
    expect(resNoRegion.validationHint).toBe('Viloyat va tumanni tanlang');

    const resNoDistrict = validateCompanyConvertForm({
      companyName: 'Akfa Imzo',
      regionCode: 'UZ-TO',
      districtCode: '',
    });
    expect(resNoDistrict.isGeoValid).toBe(false);
    expect(resNoDistrict.canSubmit).toBe(false);
  });

  it('validates 9-digit STIR correctly', () => {
    const res5Digits = validateCompanyConvertForm({
      companyName: 'Akfa Imzo',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
      tin: '12345',
    });
    expect(res5Digits.isTinValid).toBe(false);
    expect(res5Digits.canSubmit).toBe(false);
    expect(res5Digits.validationHint).toBe(`STIR ${TIN_LENGTH} ta raqamdan iborat bo'lishi kerak`);

    const res9Digits = validateCompanyConvertForm({
      companyName: 'Akfa Imzo',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
      tin: '123456789',
      adminLogin: 'admin',
      adminEmail: 'admin@akfa.uz',
    });
    expect(res9Digits.isTinValid).toBe(true);
    expect(res9Digits.canSubmit).toBe(true);

    const resEmptyTin = validateCompanyConvertForm({
      companyName: 'Akfa Imzo',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
      tin: '',
      adminLogin: 'admin',
      adminEmail: 'admin@akfa.uz',
    });
    expect(resEmptyTin.isTinValid).toBe(true);
    expect(resEmptyTin.canSubmit).toBe(true);
  });

  it('validates admin fields including invalid email format', () => {
    const resNoAdminLogin = validateCompanyConvertForm({
      companyName: 'Akfa Imzo',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
      createAdmin: true,
      adminLogin: '',
      adminEmail: 'admin@akfa.uz',
    });
    expect(resNoAdminLogin.isAdminValid).toBe(false);
    expect(resNoAdminLogin.canSubmit).toBe(false);
    expect(resNoAdminLogin.validationHint).toBe('Admin loginini kiriting');

    const resNoAdminEmail = validateCompanyConvertForm({
      companyName: 'Akfa Imzo',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
      createAdmin: true,
      adminLogin: 'admin',
      adminEmail: '',
    });
    expect(resNoAdminEmail.isAdminValid).toBe(false);
    expect(resNoAdminEmail.canSubmit).toBe(false);
    expect(resNoAdminEmail.validationHint).toBe('Admin email manzilini kiriting');

    const resInvalidEmail = validateCompanyConvertForm({
      companyName: 'Akfa Imzo',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
      createAdmin: true,
      adminLogin: 'admin',
      adminEmail: 'invalid-email',
    });
    expect(resInvalidEmail.isAdminEmailValid).toBe(false);
    expect(resInvalidEmail.isAdminValid).toBe(false);
    expect(resInvalidEmail.canSubmit).toBe(false);
    expect(resInvalidEmail.validationHint).toBe("Admin uchun to'g'ri email manzilini kiriting");

    const resAdminDisabled = validateCompanyConvertForm({
      companyName: 'Akfa Imzo',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
      createAdmin: false,
      adminLogin: '',
      adminEmail: '',
    });
    expect(resAdminDisabled.isAdminValid).toBe(true);
    expect(resAdminDisabled.canSubmit).toBe(true);
    expect(resAdminDisabled.validationHint).toBe('Kompaniya yaratishga tayyor');
  });

  it('shows submitting hint and disables submit when isSubmitting is true', () => {
    const res = validateCompanyConvertForm({
      companyName: 'Akfa Imzo',
      regionCode: 'UZ-TO',
      districtCode: 'UZ-TO-01',
      adminLogin: 'admin',
      adminEmail: 'admin@akfa.uz',
      isSubmitting: true,
    });
    expect(res.canSubmit).toBe(false);
    expect(res.validationHint).toBe('Kompaniya yaratilmoqda…');
  });
});

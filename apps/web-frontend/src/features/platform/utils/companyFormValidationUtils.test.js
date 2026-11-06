import { describe, expect, it } from 'vitest';
import {
  isValidUzPhone,
  isValidTin,
  getCompanyNameError,
  getCompanyTinError,
  getCompanyPhoneError,
  getCompanyGeoErrors,
  getCompanyBusinessTypesError,
  validateCompanyForm,
} from './companyFormValidationUtils';

describe('companyFormValidationUtils', () => {
  describe('isValidUzPhone', () => {
    it('returns false for null/empty values', () => {
      expect(isValidUzPhone('')).toBe(false);
      expect(isValidUzPhone(null)).toBe(false);
      expect(isValidUzPhone(undefined)).toBe(false);
    });

    it('returns true for valid 12-digit numbers with +998', () => {
      expect(isValidUzPhone('+998 (90) 123-45-67')).toBe(true);
      expect(isValidUzPhone('998901234567')).toBe(true);
    });

    it('returns true for 9-digit local phone numbers', () => {
      expect(isValidUzPhone('90 123 45 67')).toBe(true);
      expect(isValidUzPhone('901234567')).toBe(true);
    });

    it('returns false for incomplete or invalid phone numbers', () => {
      expect(isValidUzPhone('+998 (90) 123')).toBe(false);
      expect(isValidUzPhone('12345')).toBe(false);
      expect(isValidUzPhone('+7 900 123 45 67')).toBe(false);
    });
  });

  describe('isValidTin', () => {
    it('returns false for empty values', () => {
      expect(isValidTin('')).toBe(false);
      expect(isValidTin(null)).toBe(false);
    });

    it('returns true for exactly 9 digits', () => {
      expect(isValidTin('123456789')).toBe(true);
      expect(isValidTin('  987654321  ')).toBe(true);
    });

    it('returns false for non-9 digits', () => {
      expect(isValidTin('123')).toBe(false);
      expect(isValidTin('1234567890')).toBe(false);
      expect(isValidTin('12345678a')).toBe(false);
    });
  });

  describe('getCompanyNameError', () => {
    it('returns error when name is empty', () => {
      expect(getCompanyNameError('')).toContain('kiritilishi shart');
      expect(getCompanyNameError('   ')).toContain('kiritilishi shart');
    });

    it('returns error when name is less than 2 characters', () => {
      expect(getCompanyNameError('A')).toContain('kamida 2 ta belgidan');
    });

    it('returns null when name is valid', () => {
      expect(getCompanyNameError('Aurent')).toBeNull();
    });
  });

  describe('getCompanyTinError', () => {
    it('requires TIN in creation mode (!isEditing)', () => {
      expect(getCompanyTinError('', false)).toContain('kiritilishi shart');
      expect(getCompanyTinError(null, false)).toContain('kiritilishi shart');
    });

    it('validates 9 digits format when provided', () => {
      expect(getCompanyTinError('123', false)).toContain('9 ta raqam');
      expect(getCompanyTinError('123456789', false)).toBeNull();
    });

    it('allows empty TIN in edit mode (isEditing=true)', () => {
      expect(getCompanyTinError('', true)).toBeNull();
    });
  });

  describe('getCompanyPhoneError', () => {
    it('requires phone in creation mode (!isEditing)', () => {
      expect(getCompanyPhoneError('', false)).toContain('kiritilishi shart');
      expect(getCompanyPhoneError(null, false)).toContain('kiritilishi shart');
    });

    it('validates phone format when provided', () => {
      expect(getCompanyPhoneError('+998 90 12', false)).toContain('to‘liq kiritilishi');
      expect(getCompanyPhoneError('+998 90 123 45 67', false)).toBeNull();
    });

    it('allows empty phone in edit mode (isEditing=true)', () => {
      expect(getCompanyPhoneError('', true)).toBeNull();
    });
  });

  describe('getCompanyGeoErrors', () => {
    it('requires both region and district when creating (!isEditing)', () => {
      const emptyGeo = getCompanyGeoErrors('', '', false);
      expect(emptyGeo.region).toBe('Viloyatni tanlang');
      expect(emptyGeo.district).toBe('Tumanni tanlang');

      const onlyRegion = getCompanyGeoErrors('TAS', '', false);
      expect(onlyRegion.region).toBeNull();
      expect(onlyRegion.district).toBe('Tumanni tanlang');

      const fullGeo = getCompanyGeoErrors('TAS', 'YUN', false);
      expect(fullGeo.region).toBeNull();
      expect(fullGeo.district).toBeNull();
    });

    it('allows empty geo when editing, but requires district if region is picked', () => {
      const emptyGeo = getCompanyGeoErrors('', '', true);
      expect(emptyGeo.region).toBeNull();
      expect(emptyGeo.district).toBeNull();

      const halfGeo = getCompanyGeoErrors('TAS', '', true);
      expect(halfGeo.district).toBe('Tumanni tanlang');
    });
  });

  describe('getCompanyBusinessTypesError', () => {
    it('returns error when businessTypeIds is empty or not array', () => {
      expect(getCompanyBusinessTypesError([])).toBe('Kamida bitta faoliyat turi tanlanishi shart');
      expect(getCompanyBusinessTypesError(null)).toBe('Kamida bitta faoliyat turi tanlanishi shart');
    });

    it('returns null when at least one business type is selected', () => {
      expect(getCompanyBusinessTypesError([1])).toBeNull();
      expect(getCompanyBusinessTypesError([1, 2])).toBeNull();
    });
  });

  describe('validateCompanyForm', () => {
    it('validates a complete and correct form', () => {
      const form = {
        name: 'Aurent Retail',
        tin: '123456789',
        phone: '+998 (90) 123-45-67',
        regionCode: 'TAS',
        districtCode: 'YUN',
        businessTypeIds: [1],
      };
      const result = validateCompanyForm(form, { isEditing: false });
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('flags mandatory name, tin, phone, geo and businessTypes on empty creation form', () => {
      const form = {
        name: '',
        tin: '',
        phone: '',
        regionCode: '',
        districtCode: '',
        businessTypeIds: [],
      };
      const result = validateCompanyForm(form, { isEditing: false });
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('kiritilishi shart');
      expect(result.errors.tin).toContain('kiritilishi shart');
      expect(result.errors.phone).toContain('kiritilishi shart');
      expect(result.errors.regionCode).toBeTruthy();
      expect(result.errors.districtCode).toBeTruthy();
      expect(result.errors.businessTypeIds).toBeTruthy();
    });

    it('validates invalid TIN and incomplete phone', () => {
      const form = {
        name: 'Good Name',
        tin: '12345',
        phone: '+998 (90) 12',
        regionCode: 'TAS',
        districtCode: 'YUN',
        businessTypeIds: [1],
      };
      const result = validateCompanyForm(form, { isEditing: false });
      expect(result.isValid).toBe(false);
      expect(result.errors.tin).toContain('9 ta raqam');
      expect(result.errors.phone).toContain('to‘liq kiritilishi');
    });
  });
});

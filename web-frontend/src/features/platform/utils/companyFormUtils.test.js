import { describe, expect, it } from 'vitest';
import {
  emptyForm,
  toggleFormBusinessType,
  buildCompanyPayload,
  resolveAssignedBusinessTypes,
} from './companyFormUtils';

describe('companyFormUtils', () => {
  const constructorTypes = [
    { id: 1, code: 'UNIVERSAL', name: 'Universal' },
    { id: 10, code: 'PHARMACY', name: 'Dorixona' },
    { id: 11, code: 'RETAIL', name: 'Roznitsa' },
  ];

  describe('emptyForm', () => {
    it('returns default empty form state with correct types', () => {
      const form = emptyForm();
      expect(form.name).toBe('');
      expect(form.businessType).toBe('UNIVERSAL');
      expect(form.businessTypeIds).toEqual([]);
      expect(form.defaultBusinessTypeId).toBeNull();
      expect(form.active).toBe(true);
    });
  });

  describe('resolveAssignedBusinessTypes', () => {
    it('parses modern API response format { types: [...], defaultTypeCode } correctly', () => {
      const apiData = {
        types: [
          { id: 10, code: 'PHARMACY', defaultType: true },
          { id: 11, code: 'RETAIL', defaultType: false },
        ],
        defaultTypeCode: 'PHARMACY',
      };

      const result = resolveAssignedBusinessTypes(apiData, 'PHARMACY', constructorTypes);
      expect(result.businessTypeIds).toEqual([10, 11]);
      expect(result.defaultBusinessTypeId).toBe(10);
    });

    it('parses legacy format with businessTypes array and defaultBusinessTypeId', () => {
      const apiData = {
        businessTypes: [{ id: 10 }, { id: 11 }],
        defaultBusinessTypeId: 11,
      };

      const result = resolveAssignedBusinessTypes(apiData, 'RETAIL', constructorTypes);
      expect(result.businessTypeIds).toEqual([10, 11]);
      expect(result.defaultBusinessTypeId).toBe(11);
    });

    it('falls back to matching constructorTypes by rowBusinessType if API returns empty array', () => {
      const apiData = { types: [] };
      const result = resolveAssignedBusinessTypes(apiData, 'PHARMACY', constructorTypes);
      expect(result.businessTypeIds).toEqual([10]);
      expect(result.defaultBusinessTypeId).toBe(10);
    });

    it('falls back to rowBusinessType if API data is null or undefined (e.g. on network error)', () => {
      const result = resolveAssignedBusinessTypes(null, 'PHARMACY', constructorTypes);
      expect(result.businessTypeIds).toEqual([10]);
      expect(result.defaultBusinessTypeId).toBe(10);
    });

    it('handles empty constructorTypes and empty API gracefully', () => {
      const result = resolveAssignedBusinessTypes(null, null, []);
      expect(result.businessTypeIds).toEqual([]);
      expect(result.defaultBusinessTypeId).toBeNull();
    });

    it('defaults defaultBusinessTypeId to the first ID if no defaultType is flagged', () => {
      const apiData = {
        types: [
          { id: 10, code: 'PHARMACY' },
          { id: 11, code: 'RETAIL' },
        ],
      };
      const result = resolveAssignedBusinessTypes(apiData, null, constructorTypes);
      expect(result.businessTypeIds).toEqual([10, 11]);
      expect(result.defaultBusinessTypeId).toBe(10);
    });
  });

  describe('toggleFormBusinessType', () => {
    it('adds type to empty list and sets it as default', () => {
      const prev = {
        businessTypeIds: [],
        defaultBusinessTypeId: null,
        businessType: 'UNIVERSAL',
      };

      const updated = toggleFormBusinessType(prev, 10, constructorTypes);
      expect(updated.businessTypeIds).toEqual([10]);
      expect(updated.defaultBusinessTypeId).toBe(10);
      expect(updated.businessType).toBe('PHARMACY');
    });

    it('removes type and reassigns default to remaining type', () => {
      const prev = {
        businessTypeIds: [10, 11],
        defaultBusinessTypeId: 10,
        businessType: 'PHARMACY',
      };

      const updated = toggleFormBusinessType(prev, 10, constructorTypes);
      expect(updated.businessTypeIds).toEqual([11]);
      expect(updated.defaultBusinessTypeId).toBe(11);
      expect(updated.businessType).toBe('RETAIL');
    });
  });

  describe('buildCompanyPayload', () => {
    it('trims string fields and resolves businessType from defaultBusinessTypeId', () => {
      const form = {
        name: '  Asaxiy  ',
        legalName: '  Asaxiy Books MCHJ  ',
        tin: ' 301234567 ',
        address: '  Chilonzor  ',
        regionCode: 'TAS',
        districtCode: 'CHI',
        phone: ' +998901234567 ',
        active: true,
        businessType: 'UNIVERSAL',
        defaultBusinessTypeId: 11,
      };

      const payload = buildCompanyPayload(form, constructorTypes);
      expect(payload.name).toBe('Asaxiy');
      expect(payload.legalName).toBe('Asaxiy Books MCHJ');
      expect(payload.tin).toBe('301234567');
      expect(payload.address).toBe('Chilonzor');
      expect(payload.phone).toBe('+998901234567');
      expect(payload.businessType).toBe('RETAIL');
      expect(payload.active).toBe(true);
    });
  });
});

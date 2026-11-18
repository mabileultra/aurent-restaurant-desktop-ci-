import { describe, expect, it } from 'vitest';
import { asEntityList, buildCompanySelectOptions } from './companySelectOptions';

describe('companySelectOptions', () => {
  describe('asEntityList', () => {
    it('returns array as is', () => {
      const arr = [{ id: 1 }, { id: 2 }];
      expect(asEntityList(arr)).toBe(arr);
    });

    it('extracts content array from page response', () => {
      expect(asEntityList({ content: [{ id: 10 }] })).toEqual([{ id: 10 }]);
    });

    it('extracts items array', () => {
      expect(asEntityList({ items: [{ id: 20 }] })).toEqual([{ id: 20 }]);
    });

    it('extracts data array', () => {
      expect(asEntityList({ data: [{ id: 30 }] })).toEqual([{ id: 30 }]);
    });

    it('returns empty array for null, undefined or non-array', () => {
      expect(asEntityList(null)).toEqual([]);
      expect(asEntityList(undefined)).toEqual([]);
      expect(asEntityList({})).toEqual([]);
    });
  });

  describe('buildCompanySelectOptions', () => {
    it('sorts companies alphabetically by name and formats labels with loginCode', () => {
      const companies = [
        { id: 2, name: 'Ziyo Savdo', loginCode: 12345 },
        { id: 1, name: 'Aurent POS', loginCode: 67890 },
      ];

      const options = buildCompanySelectOptions(companies);
      expect(options).toHaveLength(2);
      expect(options[0]).toEqual({
        value: '1',
        label: 'Aurent POS (67890)',
        name: 'Aurent POS',
        legalName: '',
        keywords: 'Aurent POS 67890',
      });
      expect(options[1]).toEqual({
        value: '2',
        label: 'Ziyo Savdo (12345)',
        name: 'Ziyo Savdo',
        legalName: '',
        keywords: 'Ziyo Savdo 12345',
      });
    });

    it('includes legalName, tin, and phone in keywords for search matching', () => {
      const companies = [
        {
          id: 103,
          name: 'Makon Mobile',
          loginCode: 61147,
          legalName: 'TURAN GROUP MCHJ',
          tin: '309121333',
          phone: '+998889344444',
        },
      ];

      const options = buildCompanySelectOptions(companies);
      expect(options[0].keywords).toContain('Makon Mobile');
      expect(options[0].keywords).toContain('61147');
      expect(options[0].keywords).toContain('TURAN GROUP MCHJ');
      expect(options[0].keywords).toContain('309121333');
      expect(options[0].keywords).toContain('+998889344444');
      expect(options[0].name).toBe('Makon Mobile');
      expect(options[0].legalName).toBe('TURAN GROUP MCHJ');
    });

    it('adds emptyLabel option at the start when provided', () => {
      const companies = [{ id: 5, name: 'Test' }];
      const options = buildCompanySelectOptions(companies, { emptyLabel: 'Barcha kompaniyalar' });

      expect(options[0]).toEqual({ value: '', label: 'Barcha kompaniyalar' });
      expect(options[1].value).toBe('5');
    });
  });
});

import { describe, expect, it } from 'vitest';
import { buildBusinessTypeFilterOptions } from './businessTypeFilterOptions';

describe('buildBusinessTypeFilterOptions', () => {
  const dictionary = {
    'platform.filterAllBusinessTypes': 'Barchasi',
    'productTemplates.businessTypes.CONSTRUCTION': 'Qurilish materiallari',
    'productTemplates.businessTypes.GROCERY': 'Oziq-ovqat',
    'productTemplates.businessTypes.CLOTHING': 'Kiyim-kechak',
    'productTemplates.businessTypes.PHARMACY': 'Dorixona',
    'productTemplates.businessTypes.CANTEEN': 'Oshxona / bufet',
    'productTemplates.businessTypes.RESTAURANT': 'Restoran',
    'productTemplates.businessTypes.AUTO_PARTS': 'Avto ehtiyot qismlari',
    'productTemplates.businessTypes.UNIVERSAL': 'Universal / gipermarket',
  };

  const mockT = (key, opts) => {
    if (dictionary[key]) return dictionary[key];
    if (opts?.defaultValue) return opts.defaultValue;
    return key;
  };

  it('translates standard business types using i18n instead of returning Russian db seed strings', () => {
    const rawApiTypes = [
      { id: 1, code: 'PHARMACY', name: 'Аптека', active: true },
      { id: 2, code: 'RESTAURANT', name: 'Ресторан', active: true },
      { id: 3, code: 'GROCERY', name: 'Продукты', active: true },
      { id: 4, code: 'CONSTRUCTION', name: 'Стройматериалы', active: true },
    ];

    const options = buildBusinessTypeFilterOptions(mockT, rawApiTypes);

    expect(options[0]).toEqual({ value: '', label: 'Barchasi' });

    const labels = options.map((o) => o.label);
    expect(labels).toContain('Dorixona');
    expect(labels).not.toContain('Аптека');

    expect(labels).toContain('Restoran');
    expect(labels).toContain('Oziq-ovqat');
    expect(labels).not.toContain('Продукты');

    expect(labels).toContain('Qurilish materiallari');
    expect(labels).not.toContain('Стройматериалы');
  });

  it('falls back to custom business type name if not in dictionary', () => {
    const rawApiTypes = [
      { id: 10, code: 'CUSTOM_FLOWERS', name: 'Gullar do‘koni', active: true },
    ];

    const options = buildBusinessTypeFilterOptions(mockT, rawApiTypes);
    const flowerOption = options.find((o) => o.value === 'CUSTOM_FLOWERS');

    expect(flowerOption).toBeDefined();
    expect(flowerOption.label).toBe('Gullar do‘koni');
  });

  it('filters out inactive business types', () => {
    const rawApiTypes = [
      { id: 1, code: 'PHARMACY', name: 'Аптека', active: false },
      { id: 2, code: 'RESTAURANT', name: 'Рестоran', active: true },
    ];

    const options = buildBusinessTypeFilterOptions(mockT, rawApiTypes);
    const pharmacyOption = options.find((o) => o.value === 'PHARMACY');
    expect(pharmacyOption).toBeUndefined();
  });
});

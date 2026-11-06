import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TaxAnalyticsFiltersPanel from './TaxAnalyticsFiltersPanel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
    i18n: { language: 'uz' },
  }),
}));

describe('TaxAnalyticsFiltersPanel', () => {
  it('renders all filters using PlatformSelect and does not contain raw select tags', () => {
    const draft = {
      regionCode: '1735',
      districtCode: '',
      enterpriseType: 'LEGAL',
      activitySubtype: '',
      connectionStatus: '',
      activityStatus: '',
      dynamics: '',
      hasErrors: '',
      connectionFrom: '',
      connectionTo: '',
      turnoverFrom: '',
      turnoverTo: '',
      turnoverMin: '',
      turnoverMax: '',
      fiscalShareMin: '',
      fiscalShareMax: '',
      lastActivityFrom: '',
      lastActivityTo: '',
      search: '',
    };

    const regions = [
      { regionCode: '1735', nameUz: "Qoraqalpog''iston Respublikasi", nameRu: 'Республика Каракалпакстан' },
      { regionCode: '1726', nameUz: 'Toshkent shahri', nameRu: 'г. Ташкент' },
    ];

    const districts = [
      { code: '1735204', nameUz: 'Nukus shahri', nameRu: 'г. Нукус' },
    ];

    const mockT = (k) => k;
    const labelGeo = (r) => r.nameUz;

    const html = renderToStaticMarkup(
      React.createElement(TaxAnalyticsFiltersPanel, {
        t: mockT,
        draft,
        setDraft: vi.fn(),
        regions,
        districts,
        labelGeo,
        onApply: vi.fn(),
        onReset: vi.fn(),
        onSave: vi.fn(),
        onLoad: vi.fn(),
        onExport: vi.fn(),
      })
    );

    // Verify PlatformSelect is used
    expect(html).toContain('platform-select');
    // All selects are now encapsulated inside BaseSelect (with base-select__native)
    const nativeSelectMatches = html.match(/<select class="base-select__native"/g);
    expect(nativeSelectMatches?.length).toBe(8);
    // Double apostrophes must be cleanly sanitized
    expect(html).toContain('Qoraqalpog‘iston Respublikasi');
    expect(html).not.toContain("Qoraqalpog''iston");
    // Selected filters should have active filter highlight
    expect(html).toContain('platform-select--active');
  });

  it('renders district select as disabled when region is not selected', () => {
    const draft = {
      regionCode: '',
      districtCode: '',
    };

    const mockT = (k) => k;
    const labelGeo = (r) => r.nameUz;

    const html = renderToStaticMarkup(
      React.createElement(TaxAnalyticsFiltersPanel, {
        t: mockT,
        draft,
        setDraft: vi.fn(),
        regions: [],
        districts: [],
        labelGeo,
        onApply: vi.fn(),
        onReset: vi.fn(),
        onSave: vi.fn(),
        onLoad: vi.fn(),
        onExport: vi.fn(),
      })
    );

    expect(html).toContain('base-select--disabled');
    expect(html).toContain('platform-select');
  });
});

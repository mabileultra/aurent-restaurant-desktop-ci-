import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GeoFilterSelects from './GeoFilterSelects';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
    i18n: { language: 'uz' },
  }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: ({ queryKey }) => {
      if (queryKey[0] === 'geo-regions') {
        return {
          data: [
            { code: 'SAMARQAND', nameUz: 'Samarqand viloyati', nameRu: 'Самаркандская область' },
            { code: 'QR', nameUz: "Qoraqalpog''iston Respublikasi", nameRu: 'Республика Каракалпакстан' },
          ],
          isPending: false,
        };
      }
      if (queryKey[0] === 'geo-districts') {
        return {
          data: [
            { code: 'BULUNGUR', nameUz: "Bulung''ur t.", nameRu: 'Булунгурский р-н' },
          ],
          isPending: false,
        };
      }
      return { data: [], isPending: false };
    },
  };
});

describe('GeoFilterSelects', () => {
  it('renders modern BaseSelect for regions and cleans escaped apostrophes', () => {
    const html = renderToStaticMarkup(
      React.createElement(GeoFilterSelects, {
        regionCode: '',
        districtCode: '',
        onChange: vi.fn(),
      })
    );

    // Must use BaseSelect component
    expect(html).toContain('base-select');
    expect(html).toContain('geo-filter-select');

    // Escaped apostrophes must be cleaned to proper Uzbek apostrophe
    expect(html).toContain('Qoraqalpog‘iston Respublikasi');
    expect(html).not.toContain("Qoraqalpog''iston");
  });

  it('renders district select when regionCode is selected', () => {
    const html = renderToStaticMarkup(
      React.createElement(GeoFilterSelects, {
        regionCode: 'SAMARQAND',
        districtCode: 'BULUNGUR',
        onChange: vi.fn(),
      })
    );

    expect(html).toContain('Bulung‘ur t.');
    expect(html).not.toContain("Bulung''ur");
    expect(html).toContain('base-select--active-filter');
  });
});

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import StoresTable from './StoresTable';

globalThis.React = React;

vi.mock('../../../shared/geo/useGeoNameLookup', () => ({
  useGeoNameLookup: () => ({
    regionName: (code) => (code === 'TAS' ? 'Toshkent sh.' : 'Yo‘q'),
    districtName: (code) => (code === 'YUN' ? 'Yunusobod' : 'Yo‘q'),
    empty: 'Yo‘q',
  }),
}));

describe('StoresTable', () => {
  const mockT = (key, opts) => opts?.defaultValue || key;

  const defaultProps = {
    t: mockT,
    isPending: false,
    rows: [
      {
        id: 'store-1',
        name: '404 Toys',
        companyName: '404 Toys MCHJ',
        regionCode: '',
        districtCode: '',
        businessType: 'RETAIL',
        address: 'Urgut Tuman Navoiy Kuchasi 8',
        phone: '+9989904775656',
        active: true,
      },
      {
        id: 'store-2',
        name: 'AFSONA FAYZLI XK',
        companyName: 'Afsona Fayzli XK',
        regionCode: 'TAS',
        districtCode: 'YUN',
        businessType: 'RESTAURANT',
        address: '',
        phone: '',
        active: false,
      },
    ],
    page: 0,
    pageSize: 14,
    total: 2,
    totalPages: 1,
    showCompany: true,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    menuId: null,
    onMenuOpenChange: vi.fn(),
    onEdit: vi.fn(),
    onToggleActive: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders modern branch table with avatars, formatted phone, and active status badges', () => {
    const html = renderToStaticMarkup(React.createElement(StoresTable, defaultProps));

    // Branch initials avatar
    expect(html).toContain('40'); // 404 Toys
    expect(html).toContain('AF'); // Afsona

    // Phone is formatted
    expect(html).toContain('+998 (99) 047-75-65');

    // Status badges
    expect(html).toContain('Faol');
    expect(html).toContain('Nofaol');
    expect(html).toContain('bg-emerald-50');

    // Headers
    expect(html).toContain('Filial nomi');
    expect(html).toContain('Filial turi');
  });

  it('renders clean em-dashes instead of "Yo‘q" when geo names or address are empty', () => {
    const html = renderToStaticMarkup(React.createElement(StoresTable, defaultProps));

    // Must NOT contain the raw Uzbek 'Yo‘q' word in the table body
    expect(html).not.toContain('>Yo‘q<');
    expect(html).not.toContain(">Yo'q<");

    // Must contain em-dash
    expect(html).toContain('—');
  });

  it('renders loading spinner when isPending is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoresTable, { ...defaultProps, isPending: true })
    );
    expect(html).toContain('animate-spin');
    expect(html).not.toContain('404 Toys');
  });

  it('renders empty message when rows is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoresTable, { ...defaultProps, rows: [] })
    );
    expect(html).toContain('stores.empty');
  });
});

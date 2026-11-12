import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformCompaniesTable from './PlatformCompaniesTable';

globalThis.React = React;

vi.mock('../../shared/geo/useGeoNameLookup', () => ({
  useGeoNameLookup: () => ({
    regionName: (code) => (code === 'TAS' ? 'Toshkent sh.' : code || '—'),
    districtName: (code) => (code === 'YUN' ? 'Yunusobod' : code || '—'),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PlatformCompaniesTable', () => {
  const defaultProps = {
    isPending: false,
    isError: false,
    onRetry: vi.fn(),
    rows: [
      {
        id: 'comp-1',
        name: 'Supermarket Avesta',
        regionCode: 'TAS',
        districtCode: 'YUN',
        loginCode: 'AVESTA-01',
        storeCount: 3,
        businessType: 'RETAIL',
        active: true,
      },
      {
        id: 'comp-2',
        name: 'Oshxona Rayhon',
        regionCode: '',
        districtCode: '',
        loginCode: null,
        storeCount: 0,
        businessType: 'RESTAURANT',
        active: false,
      },
    ],
    page: 0,
    pageSize: 14,
    total: 2,
    totalPages: 1,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    menuId: null,
    onMenuOpenChange: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders company rows with all formatted columns correctly', () => {
    const html = renderToStaticMarkup(React.createElement(PlatformCompaniesTable, defaultProps));

    // Company names and initials
    expect(html).toContain('Supermarket Avesta');
    expect(html).toContain('Oshxona Rayhon');
    expect(html).toContain('SA');
    expect(html).toContain('OR');

    // Geo lookup names
    expect(html).toContain('Toshkent sh.');
    expect(html).toContain('Yunusobod');

    // Login code and copy button
    expect(html).toContain('AVESTA-01');
    expect(html).toContain('Supermarket Avesta: kirish kodini nusxalash');

    // Store count
    expect(html).toContain('3');
    expect(html).toContain('0');

    // Badges
    expect(html).toContain('Faol');
    expect(html).toContain('Nofaol');
    expect(html).toContain('aa-badge--success');
  });

  it('renders 8 skeleton rows and aria-busy when isPending is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompaniesTable, {
        ...defaultProps,
        isPending: true,
      })
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aa-skel');
    // Pager yashirilgan bo'lishi kerak
    expect(html).not.toContain('Sahifada');
  });

  it('renders empty state when rows is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompaniesTable, {
        ...defaultProps,
        rows: [],
        total: 0,
      })
    );

    expect(html).toContain('Kompaniya topilmadi');
    expect(html).toContain('Qidiruv va filtrlarga mos kompaniya yo‘q');
  });

  it('renders inactive-specific empty state when inactive tab is empty without other filters', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompaniesTable, {
        ...defaultProps,
        rows: [],
        total: 0,
        statusFilter: 'INACTIVE',
        hasOtherFilters: false,
      })
    );

    expect(html).toContain('Nofaol kompaniya yo‘q');
    expect(html).toContain('Hamma kompaniyalar faol');
    expect(html).not.toContain('Filtrlarni tozalash');
  });

  it('renders alert danger when isError is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompaniesTable, {
        ...defaultProps,
        isError: true,
      })
    );

    expect(html).toContain('aa-alert--danger');
    expect(html).toContain('Kompaniyalar ro‘yxatini yuklab bo‘lmadi');
    expect(html).toContain('Qayta urinish');
  });
});

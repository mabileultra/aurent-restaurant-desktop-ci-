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

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className, title }) =>
    React.createElement('a', { href: to, className, title }, children),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PlatformCompaniesTable', () => {
  const mockT = (key, opts) => opts?.defaultValue || key;

  const defaultProps = {
    t: mockT,
    isPending: false,
    isError: false,
    error: null,
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
    expect(html).toContain('Nusxalash');

    // Store/branch link with companyId query parameter and contextual styling
    expect(html).toContain('href="/platform/stores?companyId=comp-1"');
    expect(html).toContain('href="/platform/stores?companyId=comp-2"');
    expect(html).toContain('Filiallar');
    expect(html).toContain('Restoran filiallarini ko‘rish');
    expect(html).toContain('Filiallarni ko‘rish');
    expect(html).toContain('bg-emerald-50');

    // Business type badge (neutral slate styling)
    expect(html).toContain('RETAIL');
    expect(html).toContain('RESTAURANT');
    expect(html).toContain('bg-slate-100');

    // Status badges (active vs inactive)
    expect(html).toContain('common.active');
    expect(html).toContain('common.inactive');
  });

  it('renders loading state when isPending is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompaniesTable, {
        ...defaultProps,
        isPending: true,
      })
    );

    expect(html).toContain('common.loading');
    expect(html).not.toContain('Supermarket Avesta');
  });

  it('renders empty state when rows is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompaniesTable, {
        ...defaultProps,
        rows: [],
        total: 0,
      })
    );

    expect(html).toContain('common.noData');
  });

  it('renders error state when isError is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompaniesTable, {
        ...defaultProps,
        isError: true,
        error: new Error('Failed to load companies'),
      })
    );

    expect(html).not.toContain('Supermarket Avesta');
  });
});

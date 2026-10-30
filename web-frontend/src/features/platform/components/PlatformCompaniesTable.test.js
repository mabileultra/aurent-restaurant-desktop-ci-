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

    // Store/branch link with focusCompany query parameter and hash for auto-scroll/expand
    expect(html).toContain('href="/platform/stores?focusCompany=comp-1#company-comp-1"');
    expect(html).toContain('href="/platform/stores?focusCompany=comp-2#company-comp-2"');
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

  it('renders skeleton rows when isPending is true to prevent layout shift', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompaniesTable, {
        ...defaultProps,
        isPending: true,
      })
    );

    expect(html).toContain('animate-pulse');
    expect(html).not.toContain('Supermarket Avesta');
  });

  it('renders top progress line when isRefreshing is true while keeping rows visible', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompaniesTable, {
        ...defaultProps,
        isRefreshing: true,
      })
    );

    expect(html).toContain('bg-emerald-500 animate-pulse');
    expect(html).toContain('Supermarket Avesta');
  });

  it('renders overlay spinner when showOverlay is true without unmounting rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompaniesTable, {
        ...defaultProps,
        showOverlay: true,
      })
    );

    expect(html).toContain('aur-sp-overlay');
    expect(html).toContain('Supermarket Avesta');
  });

  it('renders empty state when rows is empty and not pending', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompaniesTable, {
        ...defaultProps,
        rows: [],
        total: 0,
      })
    );

    expect(html).toContain('common.noData');
  });

  it('numbers rows and range by displayPage during page transition when previous data is visible', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompaniesTable, {
        ...defaultProps,
        page: 1, // Target page requested
        displayPage: 0, // Currently visible data is still page 0
        pageSize: 14,
        total: 28,
        totalPages: 2,
        isRefreshing: true,
      })
    );

    // Row numbers must be 1 and 2 (from displayPage 0), NOT 15 and 16
    expect(html).toContain('>1</td>');
    expect(html).toContain('>2</td>');
    expect(html).not.toContain('>15</td>');
    expect(html).not.toContain('>16</td>');
  });
});

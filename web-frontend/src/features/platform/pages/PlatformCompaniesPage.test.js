import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformCompaniesPage from './PlatformCompaniesPage';

globalThis.React = React;

vi.mock('../hooks/usePlatformCompaniesPage', () => ({
  usePlatformCompaniesPage: () => ({
    t: (key, opts) => {
      if (key === 'platform.companiesTitle') return 'Kompaniyalar';
      return opts?.defaultValue || key;
    },
    total: 102,
    totalCompanies: 102,
    activeCompanies: 98,
    inactiveCompanies: 4,
    totalStores: 148,
    statusFilter: 'ALL',
    setStatusFilter: vi.fn(),
    openCreate: vi.fn(),
    search: '',
    handleSearchChange: vi.fn(),
    businessType: '',
    handleBusinessTypeChange: vi.fn(),
    businessTypes: [{ id: 1, code: 'UNIVERSAL', name: 'Universal' }],
    regionCode: '',
    districtCode: '',
    handleGeoChange: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    rows: [
      {
        id: 62,
        name: '"ANNODENT SS" MCHJ',
        regionCode: 'SAM',
        districtCode: 'SAM_SH',
        loginCode: '54157',
        storeCount: 1,
        businessType: 'UNIVERSAL',
        active: true,
      },
    ],
    page: 0,
    pageSize: 14,
    totalPages: 1,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    menuId: null,
    setMenuId: vi.fn(),
    openEdit: vi.fn(),
    tryDelete: vi.fn(),
    modalOpen: false,
    editing: null,
    form: {},
    saveMutation: { isPending: false, mutate: vi.fn() },
    closeModal: vi.fn(),
    updateField: vi.fn(),
    toggleBusinessType: vi.fn(),
    setDefaultBusinessType: vi.fn(),
    selectedCompany: null,
    setSelectedCompany: vi.fn(),
  }),
}));

vi.mock('../../shared/geo/useGeoNameLookup', () => ({
  useGeoNameLookup: () => ({
    regionName: () => 'Samarqand viloyati',
    districtName: () => 'Samarqand sh.',
  }),
}));

vi.mock('../../shared/geo/GeoFilterSelects', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-geo-selects' }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className }) =>
    React.createElement('a', { href: to, className }, children),
  useNavigate: () => vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PlatformCompaniesPage', () => {
  it('renders the modernized page with KPI cards, status tabs, and company list', () => {
    const html = renderToStaticMarkup(React.createElement(PlatformCompaniesPage));

    // Page title with count
    expect(html).toContain('Kompaniyalar (102)');

    // KPI cards
    expect(html).toContain('Jami kompaniyalar');
    expect(html).toContain('Faol kompaniyalar');
    expect(html).toContain('Ulangan do‘konlar');
    expect(html).toContain('Nofaollar');

    // Segmented tabs
    expect(html).toContain('Barchasi');
    expect(html).toContain('Faol');
    expect(html).toContain('Nofaol');

    // Table rows
    expect(html).toContain('ANNODENT SS');
    expect(html).toContain('54157');
  });
});

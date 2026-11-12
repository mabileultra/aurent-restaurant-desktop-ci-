import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlatformCompaniesPage from './PlatformCompaniesPage';

globalThis.React = React;

let mockHookData = {};

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
    tryToggleActive: vi.fn(),
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
    companyToToggleActive: null,
    ...mockHookData,
  }),
}));

vi.mock('../../shared/geo/useGeoNameLookup', () => ({
  useGeoNameLookup: () => ({
    regionName: () => 'Samarqand viloyati',
    districtName: () => 'Samarqand sh.',
  }),
}));

vi.mock('../../../api/geo.api', () => ({
  geoApi: {
    regions: vi.fn().mockResolvedValue({
      data: [{ code: 'SAM', nameUz: 'Samarqand viloyati' }],
    }),
    districts: vi.fn().mockResolvedValue({
      data: [{ code: 'SAM_SH', nameUz: 'Samarqand sh.' }],
    }),
  },
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
  const qc = new QueryClient();

  const renderPage = () =>
    renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(PlatformCompaniesPage)
      )
    );

  it('renders the modernized page with PageHeader, KPI cards, and company list', () => {
    mockHookData = {};
    const html = renderPage();

    // PageHeader
    expect(html).toContain('Kompaniyalar');
    expect(html).toContain('102 ta kompaniya · 148 ta filial');
    expect(html).toContain('Kompaniya qo‘shish');

    // KPI cards
    expect(html).toContain('Jami kompaniyalar');
    expect(html).toContain('Faol kompaniyalar');
    expect(html).toContain('Ulangan filiallar');
    expect(html).toContain('Nofaol kompaniyalar');

    // Segmented tabs & Toolbar
    expect(html).toContain('Barchasi');
    expect(html).toContain('Faol');
    expect(html).toContain('Nofaol');
    expect(html).toContain('102 ta kompaniya');

    // Table rows
    expect(html).toContain('ANNODENT SS');
    expect(html).toContain('54157');
  });

  it('renders PlatformCompanyToggleActiveModal when companyToToggleActive is present', () => {
    mockHookData = {
      companyToToggleActive: {
        id: 127,
        name: 'Dori Darmon',
        active: true,
        loginCode: 'DD-127',
        storeCount: 1,
      },
    };
    const html = renderPage();
    expect(html).toContain('Dori Darmon');
    expect(html).toContain('Kompaniyani faolsizlantirish');
    expect(html).toContain('Faolsizlantirish');
  });
});

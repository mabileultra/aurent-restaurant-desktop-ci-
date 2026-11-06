import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import StoresPage from './StoresPage';

globalThis.React = React;

vi.mock('../../shared/geo/GeoFilterSelects', () => ({
  default: () => React.createElement('div', { className: 'mock-geo' }),
}));

vi.mock('../hooks/useStoresPage', () => ({
  useStoresPage: () => ({
    t: (key, opts) => opts?.defaultValue || key,
    search: '',
    handleSearchChange: vi.fn(),
    companyId: '',
    handleCompanyChange: vi.fn(),
    businessType: '',
    handleBusinessTypeChange: vi.fn(),
    regionCode: '',
    districtCode: '',
    handleGeoChange: vi.fn(),
    statusFilter: 'ALL',
    setStatusFilter: vi.fn(),
    viewMode: 'table',
    setViewMode: vi.fn(),
    totalStores: 114,
    activeStores: 113,
    inactiveStores: 1,
    companiesCount: 65,
    isPending: false,
    isRefreshing: false,
    showRefreshingOverlay: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    rows: [
      {
        id: 1,
        name: 'Chilonzor Filiali',
        companyName: 'Test MCHJ',
        businessType: 'RETAIL',
        active: true,
      },
    ],
    page: 0,
    displayPage: 0,
    pageSize: 14,
    total: 1,
    totalPages: 1,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    menuId: null,
    setMenuId: vi.fn(),
    openCreate: vi.fn(),
    openEdit: vi.fn(),
    tryDelete: vi.fn(),
    tryToggleActive: vi.fn(),
    openPharmacyIntegration: vi.fn(),
    openQuickDrawer: vi.fn(),
    closeQuickDrawer: vi.fn(),
    closeModal: vi.fn(),
    modalOpen: false,
    editing: null,
    saveMutation: { mutate: vi.fn(), isPending: false },
    companies: [{ id: 1, name: 'Test MCHJ' }],
    businessTypes: [{ code: 'RETAIL', name: 'Chakana savdo' }],
    allStores: [],
    storeToDelete: null,
    setStoreToDelete: vi.fn(),
    handleConfirmDelete: vi.fn(),
    isDeleting: false,
    storeToToggleActive: null,
    setStoreToToggleActive: vi.fn(),
    handleConfirmToggleActive: vi.fn(),
    isTogglingActive: false,
    selectedStore: null,
    pharmacyIntegrationStore: null,
    closePharmacyIntegration: vi.fn(),
  }),
}));

vi.mock('../../shared/geo/useGeoNameLookup', () => ({
  useGeoNameLookup: () => ({
    regionName: () => '',
    districtName: () => '',
    empty: '—',
  }),
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('StoresPage', () => {
  it('renders stores page title, action button, stats cards, and table', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const html = renderToStaticMarkup(
      React.createElement(QueryClientProvider, { client: qc },
        React.createElement(StoresPage, { showCompanySelect: true })
      )
    );

    expect(html).toContain('Filiallar');
    expect(html).toContain('Filial qo‘shish');
    expect(html).toContain('Chilonzor Filiali');
    expect(html).toContain('114');
  });
});

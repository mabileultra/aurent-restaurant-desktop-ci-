import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

globalThis.React = React;
import PlatformBillingPage from './PlatformBillingPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'uz' },
  }),
}));

vi.mock('../../../components/ui/BaseSelect', () => ({
  default: () => React.createElement('div', { className: 'mock-select' }),
}));

vi.mock('../../shared/geo/GeoFilterSelects', () => ({
  default: () => React.createElement('div', { className: 'mock-geo' }),
}));

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

const mockPlatformBillingData = {
  t: (key) => key,
  money: (v) => `${v}`,
  formatDate: (d) => d || '—',
  selectCompany: vi.fn(),
  plans: [],
  collections: {
    overview: {},
    tab: 'ALL',
    setTab: vi.fn(),
    tabCount: () => 1,
    total: 1,
    pagedRows: [
      {
        billing: {
          companyId: 62,
          companyName: "''ANNODENT SS'' MCHJ",
          planId: null,
          planName: null,
          monthlyTotal: 0,
          balance: 0,
          nextChargeAt: null,
        },
        paymentState: 'NOT_BILLED',
        regionCode: 'SAMARQAND',
        districtCode: 'SAMARQAND_SH',
        newCompany: false,
        lastPaymentMethod: null,
      },
    ],
    selectedIds: new Set(),
    allPageSelected: false,
    toggleSelectPage: vi.fn(),
    clearSelection: vi.fn(),
    page: 1,
    pageSize: 10,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
  },
  actions: {
    exporting: false,
    exportExcel: vi.fn(),
    exportCsv: vi.fn(),
    bulkMode: false,
  },
  openPaymentModal: vi.fn(),
  selectedCompanyId: null,
  paymentModalOpen: false,
};

vi.mock('../hooks/usePlatformBillingPage', () => ({
  usePlatformBillingPage: () => mockPlatformBillingData,
}));

vi.mock('../../shared/geo/useGeoNameLookup', () => ({
  useGeoNameLookup: () => ({
    regionName: () => 'Samarqand viloyati',
    districtName: () => 'Samarqand sh.',
  }),
}));

describe('PlatformBillingPage layout', () => {
  it('renders table at full width without side panels', () => {
    const html = renderToStaticMarkup(React.createElement(PlatformBillingPage));

    // Must contain table card and company row data
    expect(html).toContain('bc-table-card');
    expect(html).toContain('ANNODENT SS');
    expect(html).toContain('Samarqand viloyati');
    expect(html).toContain('Samarqand sh.');

    // Must NOT contain the removed side layout or panels
    expect(html).not.toContain('bc-layout');
    expect(html).not.toContain('bc-layout__side');
    expect(html).not.toContain('upcomingTitle');
    expect(html).not.toContain('queueTitle');
  });
});


import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformStoresGroupedView from './PlatformStoresGroupedView';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, opts) => {
      if (key === 'products.recordsRange') {
        return `Yozuvlar ${opts.from} – ${opts.to} / ${opts.total}`;
      }
      if (key === 'cashRegisters.pageSizePrefix') return 'Sahifada:';
      if (key === 'common.prev') return 'Oldingi';
      if (key === 'common.next') return 'Keyingi';
      return opts?.defaultValue || key;
    },
    i18n: { language: 'uz' },
  }),
}));

vi.mock('../../../shared/geo/useGeoNameLookup', () => ({
  useGeoNameLookup: () => ({
    regionName: (code) => (code === 'TAS' ? 'Toshkent sh.' : 'Yo‘q'),
    districtName: (code) => (code === 'YUN' ? 'Yunusobod' : 'Yo‘q'),
    empty: 'Yo‘q',
  }),
}));

describe('PlatformStoresGroupedView', () => {
  const mockT = (key, opts) => {
    if (opts?.count !== undefined) {
      if (key === 'platform.groupedBranchesCount') return `${opts.count} ta filial`;
      if (key === 'platform.groupedActiveCount') return `${opts.count} faol`;
      if (key === 'platform.groupedInactiveCount') return `${opts.count} nofaol`;
    }
    return opts?.defaultValue || key;
  };

  const mockCompanies = [
    { id: 1, name: 'EVOS Fast Food MCHJ', businessType: 'RESTAURANT', tin: '123456789' },
    { id: 2, name: 'Dori-Darmon Farmatsiya', businessType: 'PHARMACY', tin: '987654321' },
  ];

  const mockStores = [
    {
      id: 101,
      companyId: 1,
      companyName: 'EVOS Fast Food MCHJ',
      name: 'EVOS Chilonzor',
      businessType: 'RESTAURANT',
      phone: '+998901112233',
      address: 'Chilonzor 1-mavze',
      regionCode: 'TAS',
      districtCode: 'YUN',
      active: true,
    },
    {
      id: 102,
      companyId: 1,
      companyName: 'EVOS Fast Food MCHJ',
      name: 'EVOS Yunusobod',
      businessType: 'RESTAURANT',
      phone: '+998904445566',
      address: 'Yunusobod 4-mavze',
      regionCode: 'TAS',
      districtCode: 'YUN',
      active: false,
    },
    {
      id: 201,
      companyId: 2,
      companyName: 'Dori-Darmon Farmatsiya',
      name: 'Apteka Markaziy',
      businessType: 'PHARMACY',
      phone: '+998907778899',
      address: 'Amir Temur shoh ko‘chasi 10',
      regionCode: 'TAS',
      districtCode: 'YUN',
      active: true,
    },
  ];

  const defaultProps = {
    t: mockT,
    stores: mockStores,
    companies: mockCompanies,
    search: '',
    businessType: '',
    regionCode: '',
    districtCode: '',
    statusFilter: 'ALL',
    isPending: false,
    menuId: null,
    onMenuOpenChange: vi.fn(),
    onEdit: vi.fn(),
    onToggleActive: vi.fn(),
    onDelete: vi.fn(),
    onPharmacyIntegration: vi.fn(),
    onSelectStore: vi.fn(),
    openCreateForCompany: vi.fn(),
  };

  it('renders company hierarchy cards with company names, STIR, and branch count pills', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, defaultProps)
    );

    // Company headers
    expect(html).toContain('EVOS Fast Food MCHJ');
    expect(html).toContain('Dori-Darmon Farmatsiya');
    expect(html).toContain('STIR: 123456789');

    // Branch counts for EVOS (2 branches, 1 active, 1 inactive)
    expect(html).toContain('2 ta filial');
    expect(html).toContain('1 faol');
    expect(html).toContain('1 nofaol');

    // Branch counts for Dori-Darmon (1 branch, 1 active)
    expect(html).toContain('1 ta filial');
  });

  it('renders sub-table of branches inside expanded company accordion', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, defaultProps)
    );

    expect(html).toContain('EVOS Chilonzor');
    expect(html).toContain('EVOS Yunusobod');
    expect(html).toContain('Apteka Markaziy');

    // Formatted phone
    expect(html).toContain('+998 (90) 111-22-33');

    // Status badges
    expect(html).toContain('Faol');
    expect(html).toContain('Nofaol');
  });

  it('filters branches by statusFilter (ACTIVE)', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, {
        ...defaultProps,
        statusFilter: 'ACTIVE',
      })
    );

    expect(html).toContain('EVOS Chilonzor');
    expect(html).toContain('Apteka Markaziy');
    expect(html).not.toContain('EVOS Yunusobod');
  });

  it('filters branches by search query', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, {
        ...defaultProps,
        search: 'Apteka',
      })
    );

    expect(html).toContain('Apteka Markaziy');
    expect(html).not.toContain('EVOS Chilonzor');
  });

  it('renders empty message when no stores match the search query', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, {
        ...defaultProps,
        search: 'Non-existent branch 9999',
      })
    );

    expect(html).toContain('Filiallar topilmadi');
  });

  it('renders skeleton cards when isPending is true to prevent layout shift', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, {
        ...defaultProps,
        isPending: true,
      })
    );

    expect(html).toContain('animate-pulse');
    expect(html).not.toContain('EVOS Fast Food');
  });

  it('renders top progress line when isRefreshing is true while keeping company groups visible', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, {
        ...defaultProps,
        isRefreshing: true,
      })
    );

    expect(html).toContain('bg-emerald-500 animate-pulse');
    expect(html).toContain('EVOS Fast Food');
  });

  it('renders overlay spinner when showOverlay is true without unmounting company groups', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, {
        ...defaultProps,
        showOverlay: true,
      })
    );

    expect(html).toContain('aur-sp-overlay');
    expect(html).toContain('EVOS Fast Food');
  });

  it('filters by companyId and isolates selected company and its branches', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, {
        ...defaultProps,
        companyId: '2',
      })
    );

    // Dori-Darmon Farmatsiya (companyId: 2) should be present
    expect(html).toContain('Dori-Darmon Farmatsiya');
    expect(html).toContain('Apteka Markaziy');

    // EVOS Fast Food MCHJ (companyId: 1) should be filtered out
    expect(html).not.toContain('EVOS Fast Food MCHJ');
    expect(html).not.toContain('EVOS Chilonzor');
    expect(html).not.toContain('EVOS Yunusobod');

    // Toolbar count should reflect strictly 1 company and 1 filial
    expect(html).toContain('1 ta kompaniya • 1 ta filial');
  });

  it('auto-expands and highlights target company when focusCompanyId is provided without filtering out other companies', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, {
        ...defaultProps,
        focusCompanyId: '2',
      })
    );

    // Both companies remain present in directory list
    expect(html).toContain('EVOS Fast Food MCHJ');
    expect(html).toContain('Dori-Darmon Farmatsiya');

    // DOM scroll anchors exist
    expect(html).toContain('id="company-group-1"');
    expect(html).toContain('id="company-group-2"');

    // Focused company 2 (Dori-Darmon Farmatsiya) is auto-expanded and highlighted with emerald ring
    expect(html).toContain('Apteka Markaziy');
    expect(html).toContain('ring-emerald-500');

    // Overall count maintains all companies and branches
    expect(html).toContain('2 ta kompaniya • 3 ta filial');
  });

  it('respects controlled hasUserToggled and expandedIds when user collapses a focused company', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, {
        ...defaultProps,
        focusCompanyId: '2',
        hasUserToggled: true,
        expandedIds: new Set(), // user collapsed it
      })
    );

    // Company remains present in directory list
    expect(html).toContain('Dori-Darmon Farmatsiya');

    // Branches should be collapsed (not in DOM)
    expect(html).not.toContain('Apteka Markaziy');
  });

  it('renders TablePagination footer with total records range and page size selector', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, defaultProps)
    );

    // Records range
    expect(html).toContain('Yozuvlar 1 – 2 / 2');
    expect(html).toContain('Sahifada:');
  });

  it('shows pagination for StoresPage serverPaged props (groups/totalGroups aliases)', () => {
    const groups = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      company: { id: i + 1, name: `Kompaniya #${i + 1}` },
      stores: [],
      total: 0,
      activeCount: 0,
      inactiveCount: 0,
    }));
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, {
        ...defaultProps,
        stores: [],
        companies: [],
        groups,
        serverPaged: true,
        totalGroups: 25,
        page: 0,
        pageSize: 10,
      })
    );

    expect(html).toContain('Yozuvlar 1 – 10 / 25');
    expect(html).toContain('Sahifada:');
  });

  it('paginates company groups based on pageSize and only renders visible page slice', () => {
    const manyCompanies = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `Kompaniya #${i + 1}`,
      businessType: 'RETAIL',
    }));
    const manyStores = Array.from({ length: 15 }, (_, i) => ({
      id: 100 + i + 1,
      companyId: i + 1,
      name: `Filial #${i + 1}`,
      businessType: 'RETAIL',
      active: true,
    }));

    // Page 0 with pageSize 10 should render first 10 companies, but not company 11-15
    const htmlPage0 = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, {
        ...defaultProps,
        companies: manyCompanies,
        stores: manyStores,
        page: 0,
        pageSize: 10,
      })
    );

    expect(htmlPage0).toContain('id="company-group-1"');
    expect(htmlPage0).toContain('id="company-group-10"');
    expect(htmlPage0).not.toContain('id="company-group-11"');
    expect(htmlPage0).not.toContain('id="company-group-15"');
    expect(htmlPage0).toContain('Yozuvlar 1 – 10 / 15');

    // Page 1 with pageSize 10 should render company 11-15, but not company 1-10
    const htmlPage1 = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, {
        ...defaultProps,
        companies: manyCompanies,
        stores: manyStores,
        page: 1,
        pageSize: 10,
      })
    );

    expect(htmlPage1).not.toContain('id="company-group-1"');
    expect(htmlPage1).not.toContain('id="company-group-10"');
    expect(htmlPage1).toContain('id="company-group-11"');
    expect(htmlPage1).toContain('id="company-group-15"');
    expect(htmlPage1).toContain('Yozuvlar 11 – 15 / 15');
  });

  it('auto-switches to the page containing focusCompanyId when target company is on a subsequent page', () => {
    const manyCompanies = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `Kompaniya #${i + 1}`,
      businessType: 'RETAIL',
    }));
    const manyStores = Array.from({ length: 15 }, (_, i) => ({
      id: 100 + i + 1,
      companyId: i + 1,
      name: `Filial #${i + 1}`,
      businessType: 'RETAIL',
      active: true,
    }));

    const onPageChangeMock = vi.fn();

    const html = renderToStaticMarkup(
      React.createElement(PlatformStoresGroupedView, {
        ...defaultProps,
        companies: manyCompanies,
        stores: manyStores,
        focusCompanyId: '14',
        page: 1,
        pageSize: 10,
        onPageChange: onPageChangeMock,
      })
    );

    expect(html).toContain('Kompaniya #14');
    expect(html).toContain('id="company-group-14"');
  });
});

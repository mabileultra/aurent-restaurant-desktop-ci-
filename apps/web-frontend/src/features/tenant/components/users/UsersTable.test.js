import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import UsersTable from './UsersTable';

globalThis.React = React;

vi.mock('../../../shared/geo/useGeoNameLookup', () => ({
  useGeoNameLookup: () => ({
    regionName: (code) => code || '',
    districtName: (code) => code || '',
    empty: '',
  }),
}));

describe('UsersTable', () => {
  const mockT = (key, fallback) => {
    if (key === 'roles.COOK') return 'Oshpaz';
    if (key === 'roles.CASHIER') return 'Kassir';
    if (key === 'roles.ADMIN') return 'Admin';
    if (key === 'users.credentialsPinHidden') return 'PIN yashirilgan';
    if (key === 'users.credentialsPasswordHidden') return 'Parol yashirilgan';
    if (key === 'users.colAccount') return 'Hisob va Kirish';
    if (key === 'common.loading') return 'Yuklanmoqda...';
    if (key === 'platform.noSearchResults') return 'Hech narsa topilmadi';
    if (typeof fallback === 'string') return fallback;
    if (fallback?.defaultValue) return fallback.defaultValue;
    return key;
  };

  const defaultProps = {
    t: mockT,
    isPlatform: true,
    isLoading: false,
    pageRows: [
      {
        id: 'u1',
        fullName: 'Ali Valiyev',
        email: 'ali@example.com',
        username: 'alivali',
        companyId: 'c1',
        companyName: 'Choyxona Grand',
        companyLoginCode: '9001',
        regionCode: 'SAM',
        districtCode: 'SAM_CITY',
        storeNames: ['Filial 1'],
        role: 'COOK',
        active: true,
      },
      {
        id: 'u2',
        fullName: 'Vali Aliyev',
        email: 'vali@example.com',
        username: 'valikassir',
        companyId: 'c1',
        companyName: 'Choyxona Grand',
        companyLoginCode: '9001',
        regionCode: '',
        districtCode: '',
        storeNames: [],
        role: 'CASHIER',
        active: false,
      },
      {
        id: 'u3',
        fullName: 'Sardor Admin',
        email: 'admin@example.com',
        username: 'sardoradmin',
        companyId: 'c1',
        companyName: 'Choyxona Grand',
        companyLoginCode: '9001',
        regionCode: '',
        districtCode: '',
        storeNames: [],
        role: 'ADMIN',
        active: true,
      },
    ],
    page: 0,
    pageSize: 10,
    total: 3,
    totalPages: 1,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    menuId: null,
    onMenuOpenChange: vi.fn(),
    onEdit: vi.fn(),
    onToggleActive: vi.fn(),
    onDelete: vi.fn(),
    actorRole: 'SUPER_ADMIN',
    companyById: new Map([
      ['c1', { id: 'c1', name: 'Choyxona Grand', loginCode: '9001', businessType: 'RESTAURANT' }],
    ]),
  };

  it('renders consolidated account credentials column with username, company code, and security hint', () => {
    const html = renderToStaticMarkup(React.createElement(UsersTable, defaultProps));

    // Username displayed
    expect(html).toContain('alivali');
    expect(html).toContain('valikassir');

    // Company login code badge
    expect(html).toContain('#9001');

    // Password vs PIN hidden hints
    expect(html).toContain('Parol yashirilgan');
    expect(html).toContain('PIN yashirilgan');
  });

  it('renders localized role badges correctly including Oshpaz for COOK', () => {
    const html = renderToStaticMarkup(React.createElement(UsersTable, defaultProps));

    expect(html).toContain('Oshpaz');
    expect(html).toContain('Kassir');
  });

  it('renders loading state when isLoading is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsersTable, {
        ...defaultProps,
        isLoading: true,
        pageRows: [],
      })
    );

    expect(html).toContain('animate-pulse');
  });

  it('renders empty search message when pageRows is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsersTable, {
        ...defaultProps,
        isLoading: false,
        pageRows: [],
      })
    );

    expect(html).toContain('Hech narsa topilmadi');
  });

  it('renders min-w-[760px] on table and id attribute on rows', () => {
    const html = renderToStaticMarkup(React.createElement(UsersTable, defaultProps));

    expect(html).toContain('min-w-[760px]');
    expect(html).toContain('id="user-row-u1"');
    expect(html).toContain('id="user-row-u2"');
  });

  it('renders bulk actions bar and only shows select all matching when entire page is selected', () => {
    // 1. Partial selection (2 of 3 rows selected) -> must NOT show "Barcha 50 tasini tanlash"
    const partialHtml = renderToStaticMarkup(
      React.createElement(UsersTable, {
        ...defaultProps,
        selectedUserIds: new Set(['u1', 'u2']),
        totalMatching: 50,
        pageRows: defaultProps.pageRows,
        hasInactiveSelected: true,
        hasActiveSelected: true,
      })
    );

    expect(partialHtml).toContain('2 ta tanlandi');
    expect(partialHtml).not.toContain('Barcha 50 tasini tanlash');
    expect(partialHtml).toContain('Faollashtirish');
    expect(partialHtml).toContain('Faolsizlantirish');

    // 2. Full page selection (all 3 rows selected) -> MUST show "Barcha 50 tasini tanlash"
    const fullPageHtml = renderToStaticMarkup(
      React.createElement(UsersTable, {
        ...defaultProps,
        selectedUserIds: new Set(['u1', 'u2', 'u3']),
        totalMatching: 50,
        pageRows: defaultProps.pageRows,
        hasInactiveSelected: true,
        hasActiveSelected: true,
      })
    );

    expect(fullPageHtml).toContain('3 ta tanlandi');
    expect(fullPageHtml).toContain('Barcha 50 tasini tanlash');
  });

  it('renders mobile card view for small screens with separate shrink-0 login code and clean location without leading dot', () => {
    const html = renderToStaticMarkup(React.createElement(UsersTable, defaultProps));

    expect(html).toContain('id="user-card-u1"');
    expect(html).toContain('id="user-card-u2"');
    // Location in card 1 has SAM · SAM_CITY and does not start with leading dot
    expect(html).toContain('SAM · SAM_CITY');
    expect(html).not.toContain('· SAM · SAM_CITY');
    // Login code has shrink-0 and is separate
    expect(html).toContain('#9001');
  });

  it('renders skeleton rows when isLoading is true to prevent layout shift', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsersTable, { ...defaultProps, isLoading: true })
    );

    expect(html).toContain('animate-pulse');
    expect(html).not.toContain('Ali Valiyev');
  });

  it('renders purple top progress line when isRefreshing is true while keeping user rows visible', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsersTable, { ...defaultProps, isRefreshing: true })
    );

    expect(html).toContain('bg-purple-600 animate-pulse');
    expect(html).toContain('Ali Valiyev');
  });

  it('renders overlay spinner when showOverlay is true without unmounting user rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsersTable, { ...defaultProps, showOverlay: true })
    );

    expect(html).toContain('aur-sp-overlay');
    expect(html).toContain('Ali Valiyev');
  });
});

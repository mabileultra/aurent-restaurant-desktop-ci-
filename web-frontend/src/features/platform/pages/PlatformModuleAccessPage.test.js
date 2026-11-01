import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PlatformModuleAccessPage from './PlatformModuleAccessPage';

globalThis.React = React;

vi.mock('../hooks/usePlatformModuleAccessPage', () => ({
  usePlatformModuleAccessPage: () => ({
    t: (key, opts) => {
      if (key === 'platform.moduleAccess.title') return 'Modullarga kirish huquqlari';
      if (key === 'platform.moduleAccess.subtitle') return 'Xodimlarga modullarni berish';
      return opts?.defaultValue || key;
    },
    userSearch: '',
    setUserSearch: vi.fn(),
    companies: [],
    companyId: '',
    handleCompanyChange: vi.fn(),
    businessTypes: [{ code: 'RESTAURANT', name: 'Restoran' }],
    businessType: '',
    handleBusinessTypeChange: vi.fn(),
    userFilter: 'all',
    userFilters: [['all', 'Barchasi'], ['custom', 'Istisnolar']],
    filterOptions: [['all', 'Barchasi'], ['custom', 'Istisnolar']],
    setUserFilter: vi.fn(),
    selectedUserId: null,
    filteredUsers: [],
    setSelectedUserId: vi.fn(),
    selectedUserIds: new Set(),
    usersLoading: false,
    usersFetching: false,
    totalUsers: 0,
    hasMoreUsers: false,
    loadMoreUsers: vi.fn(),
    unconfiguredCount: 0,
    catalog: [],
    groupedCatalog: {},
    selectedUser: null,
    moduleToggles: {},
    customAccess: false,
    detailLoading: false,
    saveMutation: { isPending: false },
    resetMutation: { isPending: false },
    bulkSaveMutation: { isPending: false },
    bulkResetMutation: { isPending: false },
    handleSave: vi.fn(),
    handleReset: vi.fn(),
    isDirty: false,
  }),
}));

describe('PlatformModuleAccessPage (Working Production Page)', () => {
  it('renders the real working module access page correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(PlatformModuleAccessPage))
    );

    expect(html).toContain('Modullarga kirish huquqlari');
    expect(html).toContain('Xodimlarga modullarni berish');
    expect(html).toContain('Yangi kartali ko&#x27;rinish (V2)');
  });
});

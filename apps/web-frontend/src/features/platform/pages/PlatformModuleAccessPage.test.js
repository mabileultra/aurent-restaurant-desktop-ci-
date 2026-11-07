import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PlatformModuleAccessPage from './PlatformModuleAccessPage';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
    i18n: { language: 'uz' },
  }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: (opts) => {
      const key = Array.isArray(opts?.queryKey) ? opts.queryKey[0] : '';
      if (key === 'access-rights-history') {
        return {
          data: [
            {
              id: 'hist-1',
              createdAt: '2026-11-07T08:00:00Z',
              action: 'UPDATE',
              actorName: 'Sardor Aliyev',
              targetFullName: 'Dilnoza Rashidova',
              targetRole: 'CASHIER',
              moduleDelta: { added: ['pos'], removed: [] },
              reverted: false,
            },
          ],
          isLoading: false,
          isPending: false,
          refetch: vi.fn(),
        };
      }
      return { data: [], isLoading: false, isPending: false };
    },
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

const mockHookData = {
  selectedBT: 'RESTAURANT',
  setSelectedBT: vi.fn(),
  businessTypes: [
    { code: 'RESTAURANT', name: 'Restoran', totalEmployees: 195 },
    { code: 'PHARMACY', name: 'Dorixona', totalEmployees: 19 },
  ],
  roles: [
    {
      code: 'ADMIN',
      name: 'Admin',
      totalEmployees: 41,
      exceptionCount: 1,
      enabledModulesCount: 56,
      totalModulesCount: 59,
    },
    {
      code: 'CASHIER',
      name: 'Kassir',
      totalEmployees: 38,
      exceptionCount: 3,
      enabledModulesCount: 7,
      totalModulesCount: 11,
    },
  ],
  users: [
    {
      userId: 'u-1',
      fullName: 'Dilnoza Rashidova',
      username: 'dilnoza.r',
      role: 'CASHIER',
      businessType: 'RESTAURANT',
      businessTypeName: 'Restoran',
      companyName: 'Bahor Restoran',
      moduleAccessCustom: true,
      exceptionCount: 1,
    },
  ],
  rawCatalog: [
    { id: 'dashboard', name: 'Boshqaruv paneli', group: 'main' },
    { id: 'pos', name: 'Kassa oynasi', group: 'registers' },
  ],
  isLoading: false,
  totalCount: 195,
  refetchAll: vi.fn(),
};

vi.mock('../components/access-rights/hooks/useAccessRightsV2Data', () => ({
  useAccessRightsV2Data: () => mockHookData,
}));

vi.mock('../components/access-rights/hooks/useAccessRightsTemplatesFlow', () => ({
  useAccessRightsTemplatesFlow: () => ({
    currentRole: 'ADMIN',
    setCurrentRole: vi.fn(),
    toggles: { dashboard: true },
    isDirty: false,
    dirtyCount: 0,
    isSaving: false,
    moduleGroups: [
      { id: 'main', title: 'Asosiy', modules: [{ id: 'dashboard', name: 'Boshqaruv paneli' }] },
    ],
    handleToggleModule: vi.fn(),
    handleEnableGroup: vi.fn(),
    handleDisableGroup: vi.fn(),
    handleReset: vi.fn(),
    handleSave: vi.fn(),
  }),
}));

vi.mock('../components/access-rights/hooks/useAccessRightsStaffFlow', () => ({
  useAccessRightsStaffFlow: () => ({
    selectedUser: mockHookData.users[0],
    setSelectedUser: vi.fn(),
    selectedUserId: 'u-1',
    overrides: {},
    templateModules: new Set(['pos']),
    isDirty: false,
    dirtyCount: 0,
    isSaving: false,
    checkedIds: new Set(),
    handleChangeOverride: vi.fn(),
    handleCancel: vi.fn(),
    handleSave: vi.fn(),
    handleResetUser: vi.fn(),
    handleBulkReset: vi.fn(),
    handleToggleCheckUser: vi.fn(),
    handleToggleCheckAll: vi.fn(),
    handleClearChecked: vi.fn(),
  }),
}));

describe('PlatformModuleAccessPage (PDF Design Implementation)', () => {
  it('renders top header with 3 tabs and KPIs on templates tab', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, { initialEntries: ['/platform/access?tab=templates'] },
        React.createElement(PlatformModuleAccessPage)
      )
    );

    expect(html).toContain('Kirish huquqlari');
    expect(html).toContain('Rol shablonlari');
    expect(html).toContain('Xodimlar va istisnolar');
    expect(html).toContain('O‘zgarishlar tarixi');
    expect(html).toContain('Jami xodim');
    expect(html).toContain('Faqat shablon bo‘yicha ishlaydi');
    expect(html).toContain('Istisnosi bor xodim');
    expect(html).toContain('Faoliyat turi');
  });

  it('renders staff tab with master-detail list and detail panel', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, { initialEntries: ['/platform/access?tab=staff'] },
        React.createElement(PlatformModuleAccessPage)
      )
    );

    expect(html).toContain('Dilnoza Rashidova');
    expect(html).toContain('dilnoza.r');
    expect(html).toContain('Shablondan');
    expect(html).toContain('Qo‘shimcha ruxsat');
    expect(html).toContain('Taqiqlangan');
    expect(html).toContain('Yakuniy kirish');
  });

  it('renders history tab with audit events and undo button', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, { initialEntries: ['/platform/access?tab=history'] },
        React.createElement(PlatformModuleAccessPage)
      )
    );

    expect(html).toContain('Barcha amallar');
    expect(html).toContain('Qaytarish');
  });
});

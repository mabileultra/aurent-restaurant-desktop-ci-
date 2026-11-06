import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PlatformModuleAccessPage from './PlatformModuleAccessPage';

globalThis.React = React;

const mockHookData = {
  selectedBT: 'RESTAURANT',
  setSelectedBT: vi.fn(),
  businessTypes: [
    { code: 'RESTAURANT', name: 'Restoran', totalEmployees: 195 },
  ],
  roles: [
    {
      code: 'ADMIN',
      name: 'Admin',
      totalEmployees: 41,
      exceptionCount: 1,
      enabledModulesCount: 56,
      totalModulesCount: 59,
      breakdown: [{ name: 'Asosiy modullar', enabled: 2, total: 3 }],
    },
    {
      code: 'COOK',
      name: 'Oshpaz',
      totalEmployees: 0,
      exceptionCount: 0,
      enabledModulesCount: 1,
      totalModulesCount: 8,
      breakdown: [],
    },
  ],
  rawUsers: [],
  moduleGroups: [],
  catalogMap: {},
  isLoading: false,
  isError: false,
  error: null,
  refetchAll: vi.fn(),
  handleResetUser: vi.fn(),
};

vi.mock('../components/access-rights/hooks/useAccessRightsV2Data', () => ({
  useAccessRightsV2Data: () => mockHookData,
}));

vi.mock('../components/access-rights/cards/RoleTemplateDrawer', () => ({
  default: () => null,
}));

vi.mock('../components/access-rights/cards/ModuleAccessHistoryDrawer', () => ({
  default: () => null,
}));

describe('PlatformModuleAccessPage (Production Access Rights Page)', () => {
  it('renders modern card-based access rights page correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(PlatformModuleAccessPage))
    );

    expect(html).toContain('Kirish huquqlari');
    expect(html).toContain('Boshqaruv');
    expect(html).toContain('Restoran');
    expect(html).toContain('Admin');
    expect(html).toContain('41 xodim');
    expect(html).toContain('Xodimi bo‘lmagan rollar');
    expect(html).toContain('O‘zgarishlar tarixi');
  });
});

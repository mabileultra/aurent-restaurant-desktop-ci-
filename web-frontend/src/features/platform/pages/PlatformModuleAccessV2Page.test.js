import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PlatformModuleAccessV2Page from './PlatformModuleAccessV2Page';

globalThis.React = React;

vi.mock('../components/access-rights/hooks/useAccessRightsV2Data', () => ({
  useAccessRightsV2Data: () => ({
    selectedBT: 'RESTAURANT',
    setSelectedBT: vi.fn(),
    businessTypes: [
      { code: 'RESTAURANT', name: 'Restoran', totalEmployees: 195 },
      { code: 'PHARMACY', name: 'Dorixona', totalEmployees: 19 },
      { code: 'GROCERY', name: 'Oziq-ovqat', totalEmployees: 81 },
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
        code: 'MANAGER',
        name: 'Menejer',
        totalEmployees: 13,
        exceptionCount: 4,
        enabledModulesCount: 47,
        totalModulesCount: 59,
        breakdown: [{ name: 'Asosiy modullar', enabled: 2, total: 3 }],
      },
      {
        code: 'CASHIER',
        name: 'Kassir',
        totalEmployees: 38,
        exceptionCount: 3,
        enabledModulesCount: 7,
        totalModulesCount: 11,
        breakdown: [{ name: 'Kassa oynasi', enabled: 3, total: 3 }],
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
  }),
}));

describe('PlatformModuleAccessV2Page', () => {
  it('renders V2 card design with real counts, business type pills, and compact empty roles', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(PlatformModuleAccessV2Page))
    );

    expect(html).toContain('Kirish huquqlari');
    expect(html).toContain('Klassik jadval');
    expect(html).toContain('Restoran');
    expect(html).toContain('195 xodim');
    expect(html).toContain('Admin');
    expect(html).toContain('41 xodim');
    expect(html).toContain('Menejer');
    expect(html).toContain('13 xodim');
    expect(html).toContain('4 istisno');
    expect(html).toContain('Kassir');
    expect(html).toContain('38 xodim');
    expect(html).toContain('Xodimi bo‘lmagan rollar');
    expect(html).toContain('Oshpaz');
    expect(html).toContain('Sozlash');
    expect(html).toContain('O‘zgarishlar tarixi');
    expect(html).toContain('Tez kunda');
  });
});

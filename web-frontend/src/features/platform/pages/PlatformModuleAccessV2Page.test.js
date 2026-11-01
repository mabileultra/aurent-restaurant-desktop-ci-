import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PlatformModuleAccessV2Page from './PlatformModuleAccessV2Page';

globalThis.React = React;

let mockHookData = {
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
};

vi.mock('../components/access-rights/hooks/useAccessRightsV2Data', () => ({
  useAccessRightsV2Data: () => mockHookData,
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

  it('renders search results section when searchTerm is active', () => {
    mockHookData = {
      ...mockHookData,
      searchTerm: 'Umid',
      rawUsers: [
        {
          userId: 'u-1',
          fullName: 'Umid Grocery',
          username: 'umid_g',
          role: 'ADMIN',
          companyName: 'Raimbobo Market',
          businessType: 'GROCERY',
          businessTypeName: 'Oziq-ovqat',
        },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(PlatformModuleAccessV2Page))
    );

    expect(html).toContain('«Umid» bo‘yicha 1 ta xodim topildi');
    expect(html).toContain('Umid Grocery');
    expect(html).toContain('Raimbobo Market');
    expect(html).toContain('Oziq-ovqat');
    // Role cards grid should NOT be rendered when search is active
    expect(html).not.toContain('Xodimi bo‘lmagan rollar');
  });
});

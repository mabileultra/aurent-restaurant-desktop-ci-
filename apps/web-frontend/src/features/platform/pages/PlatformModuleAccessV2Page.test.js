import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PlatformModuleAccessV2Page from './PlatformModuleAccessV2Page';

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
    useQuery: () => ({ data: [], isLoading: false, isPending: false }),
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

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
    },
  ],
  users: [
    {
      userId: 'u-1',
      fullName: 'Umid Grocery',
      username: 'umid_g',
      role: 'ADMIN',
      businessType: 'RESTAURANT',
      companyName: 'Umid MCHJ',
    },
  ],
  rawCatalog: [],
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
    toggles: {},
    isDirty: false,
    dirtyCount: 0,
    isSaving: false,
    moduleGroups: [],
    handleToggleModule: vi.fn(),
    handleEnableGroup: vi.fn(),
    handleDisableGroup: vi.fn(),
    handleReset: vi.fn(),
    handleSave: vi.fn(),
  }),
}));

describe('PlatformModuleAccessV2Page (Alias compatibility)', () => {
  it('renders modern access rights page via V2 alias', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(PlatformModuleAccessV2Page))
    );

    expect(html).toContain('Kirish huquqlari');
    expect(html).toContain('Rol shablonlari');
    expect(html).toContain('Xodimlar va istisnolar');
  });
});

import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useAccessRightsV2Data } from './useAccessRightsV2Data';

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'uz' } }),
}));

vi.mock('../../../../../store/authStore', () => ({
  useAuthStore: vi.fn(() => 'SUPER_ADMIN'),
}));

vi.mock('../../../../../hooks/useDebouncedValue', () => ({
  useDebouncedValue: (val) => val,
}));

vi.mock('./useAccessRightsCompanies', () => ({
  useAccessRightsCompanies: () => ({ companies: [], companiesLoading: false }),
  useAccessRightsCompaniesMap: () => new Map(),
}));

vi.mock('./useAccessRightsUnconfiguredCount', () => ({
  useAccessRightsUnconfiguredCount: () => 0,
}));

vi.mock('./useRoleDefaultsQuery', () => ({
  useRoleDefaultsQuery: () => ({}),
}));

describe('useAccessRightsV2Data hook definition and basic render', () => {
  it('exports useAccessRightsV2Data as a function without syntax or reference errors', () => {
    expect(typeof useAccessRightsV2Data).toBe('function');
  });

  it('renders correctly inside component and provides initial values', () => {
    function TestComponent() {
      const { selectedBT, businessTypes, roles } = useAccessRightsV2Data();
      return React.createElement(
        'div',
        null,
        `bt:${selectedBT},btsCount:${businessTypes.length},rolesCount:${roles.length}`
      );
    }

    const html = renderToStaticMarkup(React.createElement(TestComponent));
    expect(html).toContain('bt:RESTAURANT');
  });
});

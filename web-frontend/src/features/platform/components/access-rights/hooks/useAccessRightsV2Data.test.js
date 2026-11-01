import { describe, expect, it, vi } from 'vitest';
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

describe('useAccessRightsV2Data hook definition', () => {
  it('exports useAccessRightsV2Data as a function without syntax or reference errors', () => {
    expect(typeof useAccessRightsV2Data).toBe('function');
  });
});

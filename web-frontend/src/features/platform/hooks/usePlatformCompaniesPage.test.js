import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePlatformCompaniesPage } from './usePlatformCompaniesPage';
import { companyApi } from '../../../api/company.api';
import { storeApi } from '../../../api/store.api';

globalThis.React = React;

vi.mock('../../../api/company.api', () => ({
  companyApi: {
    getAll: vi.fn(),
    listAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../api/store.api', () => ({
  storeApi: {
    getManaged: vi.fn(),
    getAll: vi.fn(),
  },
}));

vi.mock('../../../api/companyBusinessType.api', () => ({
  companyBusinessTypeApi: {
    listByCompany: vi.fn().mockResolvedValue({ data: [] }),
    assign: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../../../api', () => ({
  platformBusinessTypeApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('usePlatformCompaniesPage performance optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT call companyApi.listAll to compute KPI cards', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Populate cache synchronously to verify KPI computation without full-table fetch
    queryClient.setQueryData(['companies', {
      page: 0,
      size: 14,
      search: undefined,
      businessType: undefined,
      regionCode: undefined,
      districtCode: undefined,
      active: undefined,
    }], {
      content: [
        { id: 1, name: 'Company A', active: true, storeCount: 3 },
        { id: 2, name: 'Company B', active: false, storeCount: 2 },
      ],
      totalElements: 42,
      totalPages: 3,
      page: 0,
      size: 14,
    });

    queryClient.setQueryData(['platform-stores-total-count'], 128);

    let hookResult;
    function Consumer() {
      hookResult = usePlatformCompaniesPage();
      return React.createElement('div', null, hookResult.totalCompanies);
    }

    renderToStaticMarkup(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(Consumer)
      )
    );

    // CRITICAL: companyApi.listAll MUST NEVER be called
    expect(companyApi.listAll).not.toHaveBeenCalled();

    // Stats are computed from totalElements and storeCountData
    expect(hookResult.totalCompanies).toBe(42);
    expect(hookResult.totalStores).toBe(128);
  });
});

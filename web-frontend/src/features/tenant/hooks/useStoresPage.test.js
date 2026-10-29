import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStoresPage } from './useStoresPage';
import { storeApi } from '../../../api/store.api';

globalThis.React = React;

vi.mock('../../../api/store.api', () => ({
  storeApi: {
    getManaged: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggle: vi.fn(),
  },
}));

vi.mock('../../../api', () => ({
  platformBusinessTypeApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../../../hooks/useCompanyOptions', () => ({
  useCompanyOptions: () => ({
    companies: [{ id: 1, name: 'Company 1' }, { id: 2, name: 'Company 2' }],
    companiesLoading: false,
  }),
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

describe('useStoresPage performance optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT call storeApi.getAll on standard table page view', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData(['stores-manage', {
      page: 0,
      size: 14,
      search: undefined,
      companyId: undefined,
      businessType: undefined,
      regionCode: undefined,
      districtCode: undefined,
    }], {
      content: [
        { id: 10, name: 'Store A', active: true, companyId: 1 },
        { id: 11, name: 'Store B', active: false, companyId: 1 },
      ],
      totalElements: 95,
      totalPages: 7,
      page: 0,
      size: 14,
    });

    let hookResult;
    function Consumer() {
      hookResult = useStoresPage({
        showCompanySelect: true,
        companies: [{ id: 1, name: 'Company 1' }, { id: 2, name: 'Company 2' }],
      });
      return React.createElement('div', null, hookResult.totalStores);
    }

    renderToStaticMarkup(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(Consumer)
      )
    );

    // CRITICAL: storeApi.getAll must NOT be called for standard table view
    expect(storeApi.getAll).not.toHaveBeenCalled();

    // Stats are computed from totalElements
    expect(hookResult.totalStores).toBe(95);
    expect(hookResult.companiesCount).toBe(2);
  });
});

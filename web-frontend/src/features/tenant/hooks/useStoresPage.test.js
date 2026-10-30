import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStoresPage } from './useStoresPage';
import { storeApi } from '../../../api/store.api';

globalThis.React = React;

vi.mock('../../../api/store.api', () => ({
  storeApi: {
    getManaged: vi.fn().mockResolvedValue({ data: { content: [], totalElements: 0, totalPages: 0 } }),
    getAll: vi.fn().mockResolvedValue({ data: [] }),
    getStats: vi.fn().mockResolvedValue({
      data: { totalStores: 95, activeStores: 80, inactiveStores: 15, companiesCount: 2 },
    }),
    getByCompany: vi.fn().mockResolvedValue({
      data: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 },
    }),
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

  it('does NOT load all branches until accordion expand (grouped lazy load)', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData(['stores-stats', {
      search: undefined,
      status: undefined,
      businessType: undefined,
      regionCode: undefined,
      companyId: undefined,
    }], {
      totalStores: 95,
      activeStores: 80,
      inactiveStores: 15,
      companiesCount: 2,
    });

    queryClient.setQueryData(['stores-by-company', {
      page: 0,
      size: 10,
      search: undefined,
      status: undefined,
      businessType: undefined,
      regionCode: undefined,
    }], {
      content: [
        { companyId: 1, companyName: 'Company 1', storeCount: 2, activeStoreCount: 1 },
      ],
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0,
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

    // CRITICAL: branches stay unloaded until company accordion opens
    expect(storeApi.getAll).not.toHaveBeenCalled();
    expect(hookResult.totalStores).toBe(95);
    expect(hookResult.companiesCount).toBe(2);
  });

  it('calculates dynamic companiesCount when filtering or searching', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    let hookResult;
    function Consumer() {
      hookResult = useStoresPage({
        showCompanySelect: true,
        companies: [
          { id: 1, name: 'Safia Bakery' },
          { id: 2, name: 'Korzinka' },
          { id: 3, name: 'Makro' },
        ],
      });
      return React.createElement('div', null, hookResult.companiesCount);
    }

    renderToStaticMarkup(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(Consumer)
      )
    );

    // Initial total companies count when no search
    expect(hookResult.companiesCount).toBe(3);
  });

  it('uses authoritative server stats from storeApi.getStats when available', () => {
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
      ],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 14,
    });

    queryClient.setQueryData(['stores-stats', {
      search: undefined,
      status: undefined,
      businessType: undefined,
      regionCode: undefined,
      companyId: undefined,
    }], {
      totalStores: 150,
      activeStores: 130,
      inactiveStores: 20,
      companiesCount: 45,
    });

    let hookResult;
    function Consumer() {
      hookResult = useStoresPage({
        showCompanySelect: true,
        companies: [{ id: 1, name: 'Company 1' }],
      });
      return React.createElement('div', null, hookResult.totalStores);
    }

    renderToStaticMarkup(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(Consumer)
      )
    );

    expect(hookResult.totalStores).toBe(150);
    expect(hookResult.activeStores).toBe(130);
    expect(hookResult.inactiveStores).toBe(20);
    expect(hookResult.companiesCount).toBe(45);
  });
});

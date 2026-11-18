import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCompanySearchOptions } from './useCompanySearchOptions';
import { companyApi } from '../../../api';

globalThis.React = React;

vi.mock('../../../api', () => ({
  companyApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}));

describe('useCompanySearchOptions', () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  function renderHookHelper(props = {}) {
    let hookResult = null;
    function TestComponent() {
      hookResult = useCompanySearchOptions(props);
      return React.createElement('div', null, 'OK');
    }
    renderToStaticMarkup(
      React.createElement(QueryClientProvider, { client: queryClient }, React.createElement(TestComponent))
    );
    return hookResult;
  }

  it('initializes with initialCompanies and formats options with loginCode', () => {
    const initialCompanies = [
      { id: 103, name: 'Makon Mobile', loginCode: 61147 },
    ];

    const result = renderHookHelper({ initialCompanies });

    expect(result.companies).toHaveLength(1);
    expect(result.options[0].value).toBe('103');
    expect(result.options[0].label).toBe('Makon Mobile (61147)');
    expect(typeof result.onSearchQueryChange).toBe('function');
  });

  it('includes emptyLabel at the beginning of options when provided', () => {
    const initialCompanies = [
      { id: 144, name: 'TURAN M STORES', loginCode: 23849 },
    ];

    const result = renderHookHelper({
      initialCompanies,
      emptyLabel: 'Barcha kompaniyalar',
    });

    expect(result.options).toHaveLength(2);
    expect(result.options[0]).toEqual({ value: '', label: 'Barcha kompaniyalar' });
    expect(result.options[1].value).toBe('144');
    expect(result.options[1].label).toBe('TURAN M STORES (23849)');
  });

  it('merges initialCompanies with search query result without duplicates', () => {
    const initialCompanies = [
      { id: 103, name: 'Makon Mobile', loginCode: 61147 },
    ];

    // Simulating search query cache result in queryClient
    queryClient.setQueryData(
      ['companies-search-options', 'turan', 'ALL'],
      [
        { id: 103, name: 'Makon Mobile', loginCode: 61147 },
        { id: 144, name: 'TURAN M STORES', loginCode: 23849 },
      ]
    );

    const result = renderHookHelper({
      initialCompanies,
      defaultSearchQuery: 'turan',
    });

    // Both companies should be present without duplicate 103
    expect(result.companies).toHaveLength(2);
    const ids = result.companies.map((c) => String(c.id));
    expect(ids).toContain('103');
    expect(ids).toContain('144');
    expect(result.options.some((o) => o.label.includes('TURAN M STORES'))).toBe(true);
  });

  it('fetches selectedCompany by id if it is missing from initialCompanies', () => {
    queryClient.setQueryData(
      ['company-by-id', '144'],
      { id: 144, name: 'TURAN M STORES', loginCode: 23849 }
    );

    const result = renderHookHelper({
      initialCompanies: [{ id: 103, name: 'Makon Mobile' }],
      selectedCompanyId: '144',
    });

    expect(result.companies.some((c) => String(c.id) === '144')).toBe(true);
    expect(result.options.some((o) => o.value === '144')).toBe(true);
  });
});

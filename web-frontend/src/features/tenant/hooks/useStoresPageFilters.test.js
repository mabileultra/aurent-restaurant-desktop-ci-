import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useStoresPageFilters } from './useStoresPageFilters';

globalThis.React = React;

describe('useStoresPageFilters', () => {
  function renderHookHelper(props = {}) {
    let hookResult = null;
    function TestComponent() {
      hookResult = useStoresPageFilters(props);
      return React.createElement('div', null, 'OK');
    }
    renderToStaticMarkup(React.createElement(TestComponent));
    return hookResult;
  }

  it('initializes with default filters', () => {
    const filters = renderHookHelper({ showCompanySelect: true });
    expect(filters.search).toBe('');
    expect(filters.statusFilter).toBe('ALL');
    expect(filters.page).toBe(0);
    expect(filters.pageSize).toBe(14);
    expect(filters.viewMode).toBe('grouped');
    expect(typeof filters.handleSearchChange).toBe('function');
    expect(typeof filters.handleCompanyChange).toBe('function');
    expect(typeof filters.handleGeoChange).toBe('function');
  });

  it('computes queryParams correctly with initial props', () => {
    const filters = renderHookHelper({ showCompanySelect: false, companyIdFilter: 42 });
    expect(filters.resolvedCompanyId).toBe(42);
    expect(filters.queryParams).toEqual({
      page: 0,
      size: 14,
      search: undefined,
      companyId: 42,
      businessType: undefined,
      regionCode: undefined,
      districtCode: undefined,
    });
  });
});

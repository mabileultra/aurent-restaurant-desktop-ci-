import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BillingFiltersBar from './BillingFiltersBar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'uz' },
  }),
}));

vi.mock('../../../shared/geo/GeoFilterSelects', () => ({
  default: () => React.createElement('div', { className: 'mock-geo' }),
}));

describe('BillingFiltersBar', () => {
  it('renders correctly with PlatformDateRangePicker integrated', () => {
    const mockC = {
      dateField: 'NEXT_CHARGE',
      setDateField: vi.fn(),
      from: '2026-10-01',
      to: '2026-10-26',
      setFrom: vi.fn(),
      setTo: vi.fn(),
      regionCode: '',
      districtCode: '',
      setGeo: vi.fn(),
      planId: '',
      setPlanId: vi.fn(),
      method: '',
      setMethod: vi.fn(),
      search: '',
      setSearch: vi.fn(),
      resetFilters: vi.fn(),
    };

    const mockT = (key) => key;
    const plans = [{ id: 'plan-1', name: 'Starter' }];

    const html = renderToStaticMarkup(
      React.createElement(BillingFiltersBar, {
        t: mockT,
        c: mockC,
        plans,
      }),
    );

    expect(html).toContain('bc-filters');
    expect(html).toContain('bc-filters__date');
    expect(html).toContain('base-select');
    expect(html).toContain('bc-filter-select');
    expect(html).toContain('Starter');
    // Date range picker formatted dates
    expect(html).toContain('01.10.2026 — 26.10.2026');
    // Raw inputs and controls should not exist anymore
    expect(html).not.toContain('type="date"');
    expect(html).not.toContain('bc-control');
    expect(html).not.toContain('bc-filters__dash');
  });

  it('renders placeholder when dates are empty', () => {
    const mockC = {
      dateField: 'NEXT_CHARGE',
      setDateField: vi.fn(),
      from: '',
      to: '',
      setFrom: vi.fn(),
      setTo: vi.fn(),
      regionCode: '',
      districtCode: '',
      setGeo: vi.fn(),
      planId: '',
      setPlanId: vi.fn(),
      method: '',
      setMethod: vi.fn(),
      search: '',
      setSearch: vi.fn(),
      resetFilters: vi.fn(),
    };

    const mockT = (key) => key;
    const plans = [];

    const html = renderToStaticMarkup(
      React.createElement(BillingFiltersBar, {
        t: mockT,
        c: mockC,
        plans,
      }),
    );

    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain('type="date"');
  });
});

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useViloyatDetailAnalytics } from './useViloyatDetailAnalytics';

vi.mock('../../../api/geo.api', () => ({
  geoApi: {
    regions: vi.fn().mockResolvedValue({
      data: [{ code: '18', nameUz: 'Samarqand viloyati', nameRu: 'Самаркандская область' }],
    }),
    districts: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../api/analyticsApi', () => ({
  analyticsApi: {
    getCompanies: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

function TestHarness({ regionCode, onCaptured }) {
  const state = useViloyatDetailAnalytics(regionCode);
  onCaptured(state);
  return React.createElement('div', null, state.regionName);
}

describe('useViloyatDetailAnalytics', () => {
  it('initializes with default Samarqand data and computes KPIs', () => {
    const queryClient = new QueryClient();
    let captured = null;

    renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/platform/analytics/viloyatlar/18?district=05'] },
          React.createElement(TestHarness, {
            regionCode: '18',
            onCaptured: (val) => { captured = val; },
          })
        )
      )
    );

    expect(captured).not.toBeNull();
    expect(captured.padCode).toBe('18');
    expect(captured.selectedDistrict).toBe('05');
    expect(captured.isDistrictView).toBe(true);
    expect(captured.districtCode).toBe('05');
    expect(captured.districtName).toBe('Ishtixon tumani');
    expect(captured.meta).toBe('2 korxona · 0 ulangan');
    expect(captured.activeType).toBe('A');
    expect(captured.types).toHaveLength(5);
    expect(captured.tableData.total).toBe(2);
    expect(captured.dailyBars).toHaveLength(30);
    expect(captured.topProducts).toHaveLength(5);
    expect(captured.districtsBreakdown.districts.length).toBeGreaterThan(0);
  });

  it('initializes with region wide scope when no district query param is given', () => {
    const queryClient = new QueryClient();
    let captured = null;

    renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/platform/analytics/viloyatlar/18'] },
          React.createElement(TestHarness, {
            regionCode: '18',
            onCaptured: (val) => { captured = val; },
          })
        )
      )
    );

    expect(captured.isDistrictView).toBe(false);
    expect(captured.districtCode).toBeNull();
    expect(captured.selectedDistrict).toBe('all');
    expect(captured.regionName).toBe('Samarqand viloyati');
    expect(captured.meta).toContain('63 korxona');
    expect(captured.meta).toContain('16 ta tuman va shahar');
  });
});

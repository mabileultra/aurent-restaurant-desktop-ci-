import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
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
        React.createElement(TestHarness, {
          regionCode: '18',
          onCaptured: (val) => { captured = val; },
        })
      )
    );

    expect(captured).not.toBeNull();
    expect(captured.padCode).toBe('18');
    expect(captured.activeType).toBe('A');
    expect(captured.types).toHaveLength(5);
    expect(captured.tableData.total).toBe(63);
    expect(captured.dailyBars).toHaveLength(30);
    expect(captured.topProducts).toHaveLength(5);
    expect(captured.districtsBreakdown.districts.length).toBeGreaterThan(0);
  });
});

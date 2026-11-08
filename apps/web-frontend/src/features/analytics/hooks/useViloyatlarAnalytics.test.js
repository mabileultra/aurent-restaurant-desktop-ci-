import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useViloyatlarAnalytics } from './useViloyatlarAnalytics';

globalThis.React = React;

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: ({ queryKey }) => {
      const key = queryKey[0];
      if (key === 'analytics-overview-viloyatlar') {
        return {
          data: {
            periodFrom: '2026-10-10',
            periodTo: '2026-11-08',
            kpi: {
              totalTurnover: 5000000,
              totalEnterprises: 10,
              connectedEnterprises: 4,
              newConnections: 2,
              turnoverDeltaPct: 15.5,
            },
            regions: [{ code: '18', enterprises: 6, connected: 3 }],
          },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        };
      }
      if (key === 'analytics-results-regions-viloyatlar') {
        return {
          data: {
            rows: [
              {
                regionCode: '18',
                enterprises: 6,
                connected: 3,
                totalTurnover: 4000000,
                fiscalTurnover: 3500000,
                fiscalSharePct: 87.5,
                turnoverDeltaPct: 20.0,
              },
            ],
          },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        };
      }
      if (key === 'geo-regions') {
        return {
          data: [
            { code: '18', nameUz: 'Samarqand viloyati' },
            { code: '26', nameUz: 'Toshkent shahri' },
          ],
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        };
      }
      return { data: null, isLoading: false, isError: false, refetch: vi.fn() };
    },
  };
});

describe('useViloyatlarAnalytics', () => {
  it('loads regions, aggregates turnover and handles unassigned companies', () => {
    let hookState;
    function TestComponent() {
      hookState = useViloyatlarAnalytics();
      return React.createElement('div', null, hookState.rangeLabel);
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(hookState.loading).toBe(false);
    expect(hookState.rangeLabel).toBe('2026-10-10 – 2026-11-08');
    expect(hookState.counts.all).toBe(2);
    expect(hookState.counts.active).toBe(1);
    expect(hookState.counts.empty).toBe(1);

    const sam = hookState.regions.find((r) => r.code === '18');
    expect(sam).toBeDefined();
    expect(sam.turnover).toBe(4000000);
    expect(sam.companies).toBe(6);
    expect(sam.connected).toBe(3);
    expect(sam.hasCompanies).toBe(true);

    expect(hookState.unassigned.companies).toBe(4);
    expect(hookState.unassigned.turnover).toBe(1000000);
    expect(hookState.totalCompanies).toBe(10);
    expect(hookState.kpis.length).toBe(4);
  });
});

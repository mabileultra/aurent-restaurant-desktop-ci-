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
      if (queryKey?.[0] === 'geo-districts') {
        return { data: [], isLoading: false, isError: false, isSuccess: true, refetch: vi.fn() };
      }
      return {
        data: {
          periodFrom: '2026-10-10',
          periodTo: '2026-11-08',
          summary: {
            totalEnterprises: 114,
            connected: 17,
            connectedSharePct: 14.9,
            totalTurnover: 6_070_000_000,
            totalTurnoverDeltaPct: 445.9,
            newConnections: 0,
          },
          rows: [
            {
              code: '1801',
              nameUz: 'Samarqand shahri',
              enterprises: 36,
              connected: 13,
              totalTurnover: 1_000_000_000,
              fiscalTurnover: 900_000_000,
            },
            { code: '1805', nameUz: 'Ishtixon tumani', enterprises: 2, connected: 0, totalTurnover: 0 },
            { code: '1804', nameUz: 'Jomboy tumani', enterprises: 1, connected: 0, totalTurnover: 0 },
            { code: 'UNASSIGNED', nameUz: 'Tumani belgilanmagan', enterprises: 51, connected: 0, totalTurnover: 0 },
          ],
        },
        isLoading: false,
        isError: false,
        isSuccess: true,
        refetch: vi.fn(),
      };
    },
  };
});

describe('useViloyatlarAnalytics', () => {
  it('uses results summary KPIs and district rows without mock fallback', () => {
    let hookState;
    function TestComponent() {
      hookState = useViloyatlarAnalytics();
      return React.createElement('div', null, hookState.rangeLabel);
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    expect(hookState.loading).toBe(false);
    expect(hookState.rangeLabel).toBe('10-okt – 8-noy');
    expect(hookState.counts.all).toBe(16);
    expect(hookState.totalCompanies).toBe(114);
    expect(hookState.unassigned.companies).toBe(51);

    const samSh = hookState.regions.find((r) => r.code === '01');
    expect(samSh).toBeDefined();
    expect(samSh.name).toBe('Samarqand shahri');
    expect(samSh.companies).toBe(36);
    expect(samSh.connected).toBe(13);
    expect(samSh.hasCompanies).toBe(true);

    expect(hookState.regions.find((r) => r.code === '05')?.name).toBe('Ishtixon tumani');
    expect(hookState.regions.find((r) => r.code === '04')?.name).toBe('Jomboy tumani');

    expect(hookState.kpis.length).toBe(4);
    expect(hookState.kpis[1].value).toBe('114');
    expect(hookState.kpis[2].value).toBe('17');
  });
});

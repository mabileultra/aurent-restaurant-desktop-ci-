import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PlatformAnalyticsViloyatlarPage from './PlatformAnalyticsViloyatlarPage';

globalThis.React = React;

vi.mock('../hooks/useViloyatlarAnalytics', () => ({
  useViloyatlarAnalytics: () => ({
    period: '30d',
    setPeriod: vi.fn(),
    rangeLabel: '10-oktabr – 8-noyabr, 2026',
    kpis: [
      { label: 'Umumiy aylanma', value: '4,04 mlrd so‘m', delta: 512.7, hint: 'oldingi 30 kunga nisbatan' },
      { label: 'Jami korxonalar', value: '63', hint: '16 ta tuman va shahar bo‘yicha' },
      { label: 'Ulangan korxonalar', value: '16', badgeText: '25,4%', hint: '47 ta korxona hali ulanmagan' },
      { label: 'Yangi ulanishlar', value: '11', delta: 22.2, hint: 'Tanlangan davrda' },
    ],
    filter: 'all',
    setFilter: vi.fn(),
    counts: { all: 16, active: 10, empty: 6 },
    sort: 'turnover',
    setSort: vi.fn(),
    regions: [
      {
        code: '01',
        name: 'Samarqand shahri',
        companies: 36,
        connected: 13,
        turnover: 4008345884,
        fiscalSharePct: 97.6,
        turnoverDeltaPct: 512.7,
        hasCompanies: true,
        link: '/platform/analytics/viloyatlar/18?district=01',
      },
      {
        code: '05',
        name: 'Ishtixon tumani',
        companies: 2,
        connected: 0,
        turnover: 0,
        hasCompanies: true,
        link: '/platform/analytics/viloyatlar/18?district=05',
      },
      {
        code: '07',
        name: 'Qo‘shrabot tumani',
        companies: 0,
        connected: 0,
        turnover: 0,
        hasCompanies: false,
      },
    ],
    unassigned: {
      turnover: 0,
      companies: 0,
      connected: 0,
      sharePct: 0,
    },
    totalCompanies: 63,
    loading: false,
    error: false,
    refetch: vi.fn(),
  }),
}));

describe('PlatformAnalyticsViloyatlarPage', () => {
  it('renders page header, KPI cards, filters, and districts grid', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(PlatformAnalyticsViloyatlarPage)
      )
    );

    expect(html).toContain('Samarqand viloyati tumanlari');
    expect(html).toContain('16 ta tuman va shahar · 63 korxona');
    expect(html).toContain('10-oktabr – 8-noyabr, 2026');
    expect(html).toContain('4,04 mlrd so‘m');
    expect(html).toContain('Samarqand shahri');
    expect(html).toContain('Ishtixon tumani');
    expect(html).toContain('Qo‘shrabot tumani');
    expect(html).toContain('href="/platform/analytics/viloyatlar/18?district=01"');
    expect(html).toContain('href="/platform/analytics/viloyatlar/18?district=05"');
  });
});

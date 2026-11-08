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
      { label: 'Umumiy aylanma', value: '4,22 mlrd so‘m', delta: 445.2, hint: 'oldingi 30 kunga nisbatan' },
      { label: 'Jami korxonalar', value: '114', hint: '65 tasi viloyatga biriktirilgan, 49 tasi — yo‘q' },
      { label: 'Ulangan korxonalar', value: '32', badgeText: '28,1%', hint: '82 ta korxona hali ulanmagan' },
      { label: 'Yangi ulanishlar', value: '11', delta: 22.2, hint: 'Tanlangan davrda' },
    ],
    filter: 'all',
    setFilter: vi.fn(),
    counts: { all: 14, active: 3, empty: 11 },
    sort: 'turnover',
    setSort: vi.fn(),
    regions: [
      {
        code: '18',
        name: 'Samarqand viloyati',
        companies: 63,
        connected: 16,
        turnover: 4044796184.82,
        fiscalSharePct: 97.6,
        turnoverDeltaPct: 512.7,
        hasCompanies: true,
      },
      {
        code: '03',
        name: 'Andijon viloyati',
        companies: 0,
        connected: 0,
        turnover: 0,
        hasCompanies: false,
      },
    ],
    unassigned: {
      turnover: 175600000,
      companies: 49,
      connected: 15,
      sharePct: 30.6,
    },
    totalCompanies: 114,
    loading: false,
    error: false,
    refetch: vi.fn(),
  }),
}));

describe('PlatformAnalyticsViloyatlarPage', () => {
  it('renders page header, KPI cards, filters, and regions grid', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(PlatformAnalyticsViloyatlarPage)
      )
    );

    expect(html).toContain('Viloyatlar');
    expect(html).toContain('10-oktabr – 8-noyabr, 2026');
    expect(html).toContain('4,22 mlrd so‘m');
    expect(html).toContain('Samarqand viloyati');
    expect(html).toContain('Andijon viloyati');
    expect(html).toContain('Hududi ko‘rsatilmagan');
    expect(html).toContain('href="/platform/analytics/viloyatlar/18"');
  });
});

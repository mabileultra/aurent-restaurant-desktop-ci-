import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlatformAnalyticsViloyatDetailPage from './PlatformAnalyticsViloyatDetailPage';

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

describe('PlatformAnalyticsViloyatDetailPage', () => {
  it('renders all sections faithfully according to design mockup', () => {
    const queryClient = new QueryClient();

    const html = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/platform/analytics/viloyatlar/18'] },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, {
              path: '/platform/analytics/viloyatlar/:regionCode',
              element: React.createElement(PlatformAnalyticsViloyatDetailPage),
            })
          )
        )
      )
    );

    // 1. Header & Breadcrumbs
    expect(html).toContain('Samarqand viloyati');
    expect(html).toContain('Viloyat · kod 18');
    expect(html).toContain('Barcha tumanlar');

    // 2. Business Type Tabs
    expect(html).toContain('Oziq-ovqat');
    expect(html).toContain('Restoranlar');
    expect(html).toContain('Dorixonalar');
    expect(html).toContain('Boshqalar');

    // 3. Turnover Section
    expect(html).toContain('Umumiy aylanma');
    expect(html).toContain('Butun davr');
    expect(html).toContain('Fiskal');
    expect(html).toContain('Nofiskal');
    expect(html).toContain('Kunlik aylanma · 30 kun');
    expect(html).toContain('Oylik');
    expect(html).toContain('Haftalik');
    expect(html).toContain('Yillik');
    expect(html).toContain('Kunlik');
    expect(html).toContain('Viloyat rasmi');

    // 4. Sales Analysis Section
    expect(html).toContain('Savdo tahlili');
    expect(html).toContain('Fiskal ulush');
    expect(html).toContain('Ulangan korxonalar');
    expect(html).toContain('Eng ko‘p sotilgan tovarlar');
    expect(html).toContain('Eng kam sotilgan tovarlar');
    expect(html).toContain('Tumanlar bo‘yicha aylanma');

    // 5. Companies Table Section
    expect(html).toContain('Korxonalar');
    expect(html).toContain('Farina Invest');
    expect(html).toContain('303190578');
    expect(html).toContain('Oldingi');
    expect(html).toContain('Keyingi');
  });

  it('renders district scoped title, badge, breadcrumb and action when district param is present', () => {
    const queryClient = new QueryClient();

    const html = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/platform/analytics/viloyatlar/18?district=05'] },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, {
              path: '/platform/analytics/viloyatlar/:regionCode',
              element: React.createElement(PlatformAnalyticsViloyatDetailPage),
            })
          )
        )
      )
    );

    // District-specific header elements
    expect(html).toContain('Ishtixon tumani');
    expect(html).toContain('Tuman · kod 05');
    expect(html).toContain('Samarqand viloyati');
    expect(html).toContain('Viloyat ko‘rinishi');
    expect(html).toContain('Tuman rasmi');
    expect(html).toContain('Ishtixon tumani surati shu yerga qo‘yiladi');
  });
});

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlatformAnalyticsViloyatDetailPage from './PlatformAnalyticsViloyatDetailPage';
import { SAMARQAND_COMPANIES } from '../data/samarqandMockData';

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
    getCompanies: vi.fn().mockResolvedValue({ data: { rows: [] } }),
    getResults: vi.fn().mockResolvedValue({ data: { rows: [] } }),
    getDaily: vi.fn().mockResolvedValue({ data: { days: [] } }),
    getProducts: vi.fn().mockResolvedValue({ data: { top: [], bottom: [] } }),
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
    expect(html).toContain('Barcha faoliyat turlari');

    // 2. Business Type Tabs
    expect(html).toContain('Oziq-ovqat');
    expect(html).toContain('Restoranlar');
    expect(html).toContain('Dorixonalar');
    expect(html).toContain('Boshqalar');

    // 3. Turnover Section (no mock flash — empty until API)
    expect(html).toContain('Umumiy aylanma');
    expect(html).toContain('Oxirgi 30 kun');
    expect(html).toContain('Oylik');
    expect(html).toContain('Haftalik');
    expect(html).toContain('Yillik');
    expect(html).toContain('Kunlik');
    expect(html).toContain('turnover-analytics.webp');
    expect(html).toContain('grocery.jpg');
    expect(html).toContain('restaurant.jpg');
    expect(html).toContain('pharmacy.jpg');

    // 4. Sales Analysis Section
    expect(html).toContain('Savdo tahlili');
    expect(html).toContain('Fiskal ulush');
    expect(html).toContain('Ulangan korxonalar');
    expect(html).toContain('Eng ko‘p sotilgan tovarlar');
    expect(html).toContain('Eng kam sotilgan tovarlar');

    // 5. Companies Table Section
    expect(html).toContain('Korxonalar');
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
    expect(html).not.toContain('Viloyat ko‘rinishi');
    expect(html).toContain('Aylanma · 30 kun');
  });

  it('renders district companies and excludes other districts when viewing Samarqand shahri', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['analytics-companies-detail', '18', '1801'], {
      rows: SAMARQAND_COMPANIES,
    });

    const html = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/platform/analytics/viloyatlar/18?district=01'] },
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

    expect(html).toContain('Samarqand shahri');
    expect(html).toContain('Shahar · kod 01');
    expect(html).toContain('Korxonalar bo‘yicha aylanma');
    expect(html).toContain('Farina Invest');
    expect(html).toContain('Makon Mobile');
    // Table rows must contain TIN and company names
    expect(html).toContain('303190578');
    // Crucial requirement: Urgut and Pastdarg'om must NOT be in Korxonalar bo‘yicha aylanma
    expect(html).not.toContain('Urgut tumani ·');
    expect(html).not.toContain('Pastdarg‘om tumani ·');
  });
});

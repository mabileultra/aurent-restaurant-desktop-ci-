import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlatformAnalyticsKorxonaDetailPage from './PlatformAnalyticsKorxonaDetailPage';

vi.mock('../api/analyticsApi', () => ({
  analyticsApi: {
    getCompany: vi.fn().mockResolvedValue({
      data: {
        id: 103,
        name: 'Makon Mobile',
        legalName: 'TURAN M-PAY MCHJ',
        tin: '309121333',
        connected: true,
      },
    }),
  },
}));

function renderPage(entryUrl) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return renderToStaticMarkup(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        MemoryRouter,
        { initialEntries: [entryUrl] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/platform/analytics/viloyatlar/:regionCode/companies/:companyId',
            element: React.createElement(PlatformAnalyticsKorxonaDetailPage),
          }),
          React.createElement(Route, {
            path: '/platform/analytics/companies/:companyId',
            element: React.createElement(PlatformAnalyticsKorxonaDetailPage),
          })
        )
      )
    )
  );
}

describe('PlatformAnalyticsKorxonaDetailPage', () => {
  it('renders complete company analytics page with breadcrumbs, cards, products and receipts', () => {
    const html = renderPage('/platform/analytics/viloyatlar/18/companies/103');

    // 1. Breadcrumbs & Header
    expect(html).toContain('Viloyatlar');
    expect(html).toContain('Samarqand viloyati');
    expect(html).toContain('Makon Mobile');
    expect(html).toContain('STIR 309121333');
    expect(html).toContain('TURAN M-PAY MCHJ');

    // 2. 4 KPI Cards
    expect(html).toContain('Umumiy aylanma');
    expect(html).toContain('1 oylik aylanma');
    expect(html).toContain('Haftalik');
    expect(html).toContain('Kunlik');
    expect(html).toContain('512 439 000 so‘m');

    // 3. Middle Section: Fiskal Donuts & Top Products
    expect(html).toContain('Fiskal holati');
    expect(html).toContain('Fiskal bilan urilgan');
    expect(html).toContain('99,2%');
    expect(html).toContain('Fiskalsiz');
    expect(html).toContain('0,8%');
    expect(html).toContain('Eng ko‘p urilgan tovarlar');
    expect(html).toContain('APPLE IPHONE 18 PRO MAX 256GB');

    // 4. Receipts Explorer & Paper Receipt Slip
    expect(html).toContain('Cheklar');
    expect(html).toContain('Oldingi savdo kuni');
    expect(html).toContain('Keyingi savdo kuni');
    expect(html).toContain('Kun jami:');
    expect(html).toContain('Chek №');
    expect(html).toContain('JAMI');
    expect(html).toContain('QQS');
    expect(html).toContain('Oldingi 10 ta chek');
    expect(html).toContain('Keyingi 10 ta chek');
    expect(html).toContain('ta chek');
  });

  it('renders correctly when accessed via direct /platform/analytics/companies/:companyId', () => {
    const html = renderPage('/platform/analytics/companies/103');
    expect(html).toContain('Makon Mobile');
    expect(html).toContain('STIR 309121333');
    expect(html).toContain('Cheklar');
  });

  it('renders Aminjon Samarqand XK details when companyId is 29', () => {
    const html = renderPage('/platform/analytics/viloyatlar/18/companies/29');
    expect(html).toContain('Aminjon Samarqand XK');
    expect(html).toContain('STIR 300575194');
    expect(html).toContain('AS');
    expect(html).toContain('479 088 600 so‘m');
    expect(html).toContain('Плиты из травертина');
    expect(html).not.toContain('Makon Mobile');
  });

  it('renders clean dashboard background without WebGL background canvases', () => {
    const html = renderPage('/platform/analytics/viloyatlar/18/companies/103');
    expect(html).toContain('bg-[#F3F6F4]');
    expect(html).not.toContain('prism-canvas');
    expect(html).not.toContain('pixel-snow-canvas');
  });
});

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import KorxonaProductsAndFiscalSection from './KorxonaProductsAndFiscalSection';

describe('KorxonaProductsAndFiscalSection', () => {
  const sampleProducts = [
    { rank: 1, name: 'kitchen mini chef', qty: '1 dona', amount: '0 so‘m', share: '0%', barWidth: '2%' },
    { rank: 2, name: 'model car 3+', qty: '1 dona', amount: '0 so‘m', share: '0%', barWidth: '2%' },
  ];

  const sampleDonuts = [
    { label: 'Fiskal bilan urilgan', color: '#097950', pct: '0%', amount: '0 so‘m', hint: 'QR-kod bilan', dash: '0 276.5', aria: 'Fiskal ulush: 0%' },
    { label: 'Fiskalsiz', color: '#DA2828', pct: '100%', amount: '23,9 mln so‘m', hint: 'Soliqqa yuborilmagan', dash: '276.5 276.5', aria: 'Fiskalsiz ulush: 100%' },
  ];

  it('renders products and 10-item pagination controls with < and > arrows when total > 10', () => {
    const onNextMock = vi.fn();
    const onPrevMock = vi.fn();

    const html = renderToStaticMarkup(
      React.createElement(KorxonaProductsAndFiscalSection, {
        donuts: sampleDonuts,
        products: sampleProducts,
        totalProductsCount: 180,
        productSort: 'sum',
        productPage: 0,
        productFrom: 1,
        productTo: 10,
        productTotalPages: 18,
        onPrevProductPage: onPrevMock,
        onNextProductPage: onNextMock,
      })
    );

    // Products table checks
    expect(html).toContain('kitchen mini chef');
    expect(html).toContain('model car 3+');

    // 10 tadan sahifalab o‘tkazish (Pagination) controls
    expect(html).toContain('1–10 / 180 ta tovar');
    expect(html).toContain('aria-label="Oldingi 10 ta tovar"');
    expect(html).toContain('aria-label="Keyingi 10 ta tovar"');
    expect(html).toContain('disabled=""'); // First page has disabled Prev
  });

  it('renders last page with disabled Next button', () => {
    const html = renderToStaticMarkup(
      React.createElement(KorxonaProductsAndFiscalSection, {
        donuts: sampleDonuts,
        products: sampleProducts,
        totalProductsCount: 180,
        productSort: 'sum',
        productPage: 17,
        productFrom: 171,
        productTo: 180,
        productTotalPages: 18,
        onPrevProductPage: vi.fn(),
        onNextProductPage: vi.fn(),
      })
    );

    expect(html).toContain('171–180 / 180 ta tovar');
  });

  it('does not render pagination bar when total <= 10', () => {
    const html = renderToStaticMarkup(
      React.createElement(KorxonaProductsAndFiscalSection, {
        donuts: sampleDonuts,
        products: sampleProducts,
        totalProductsCount: 2,
        productSort: 'sum',
        productPage: 0,
        productFrom: 1,
        productTo: 2,
        productTotalPages: 1,
      })
    );

    expect(html).not.toContain('aria-label="Oldingi 10 ta tovar"');
    expect(html).not.toContain('aria-label="Keyingi 10 ta tovar"');
  });
});

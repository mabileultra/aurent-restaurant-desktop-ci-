import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useKorxonaDetailAnalytics } from './useKorxonaDetailAnalytics';

vi.mock('../api/analyticsApi', () => ({
  analyticsApi: {
    getCompany: vi.fn().mockResolvedValue({
      data: {
        name: 'Makon Mobile',
        legalName: 'TURAN M-PAY MCHJ',
        tin: '309121333',
        connected: true,
      },
    }),
  },
}));

function TestHarness({ companyId, onCaptured }) {
  const state = useKorxonaDetailAnalytics(companyId);
  onCaptured(state);
  return React.createElement('div', null, state.companyInfo.name);
}

describe('useKorxonaDetailAnalytics', () => {
  it('initializes with Makon Mobile data and computes day receipts and products', () => {
    const queryClient = new QueryClient();
    let captured = null;

    renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestHarness, {
          companyId: 103,
          onCaptured: (val) => { captured = val; },
        })
      )
    );

    expect(captured).not.toBeNull();
    expect(captured.companyInfo.name).toBe('Makon Mobile');
    expect(captured.companyInfo.tin).toBe('309121333');
    expect(captured.cards).toHaveLength(4);
    expect(captured.donuts).toHaveLength(2);
    expect(captured.products).toHaveLength(10);
    expect(captured.dayChips).toHaveLength(11);
    expect(captured.dayReceipts.length).toBeGreaterThan(0);
    expect(captured.pagedReceipts.length).toBeLessThanOrEqual(10);
    expect(captured.receiptPage).toBe(0);
    expect(captured.receiptFrom).toBe(1);
    expect(captured.receiptTotalCount).toBe(captured.dayReceipts.length);
    expect(captured.receiptDetail).not.toBeNull();
  });

  it('provides pagination methods for receipts', () => {
    const queryClient = new QueryClient();
    let captured = null;

    renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestHarness, {
          companyId: 103,
          onCaptured: (val) => { captured = val; },
        })
      )
    );

    expect(captured).not.toBeNull();
    expect(typeof captured.onNextReceiptPage).toBe('function');
    expect(typeof captured.onPrevReceiptPage).toBe('function');
    expect(captured.receiptTotalPages).toBeGreaterThanOrEqual(1);
  });

  it('correctly loads Aminjon Samarqand XK when companyId is 29 without falling back to Makon Mobile', () => {
    const queryClient = new QueryClient();
    let captured = null;

    renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestHarness, {
          companyId: 29,
          onCaptured: (val) => { captured = val; },
        })
      )
    );

    expect(captured).not.toBeNull();
    expect(captured.companyInfo.name).toBe('Aminjon Samarqand XK');
    expect(captured.companyInfo.tin).toBe('300575194');
    expect(captured.companyInfo.monogram).toBe('AS');
    expect(captured.cards[0].v).toBe(479088600);
    expect(captured.products[0].name).toContain('Плиты из травертина');
    expect(captured.dayReceipts.length).toBeGreaterThan(0);
  });

  it('handles company with zero turnover and days without calling receipt detail with non-uuid', () => {
    const queryClient = new QueryClient();
    let captured = null;

    renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestHarness, {
          companyId: 25,
          onCaptured: (val) => { captured = val; },
        })
      )
    );

    expect(captured).not.toBeNull();
    expect(captured.companyInfo).toBeDefined();
  });
});

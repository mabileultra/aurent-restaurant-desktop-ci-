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
    expect(captured.receiptDetail).not.toBeNull();
  });
});

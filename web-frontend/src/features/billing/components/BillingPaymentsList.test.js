import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BillingPaymentsList from './BillingPaymentsList';

globalThis.React = React;

describe('BillingPaymentsList', () => {
  const mockT = (key, opts) => {
    if (key === 'common.loading') return 'Yuklanmoqda...';
    if (key === 'billing.paymentsEmpty') return "To'lovlar topilmadi";
    if (key === 'billing.currency') return "so'm";
    if (key === 'billing.paymentsProvider') return 'Usul';
    if (key === 'billing.amountLabel') return "To'ldirish summasi";
    if (key === 'billing.paymentsStatus') return 'Holat';
    if (key === 'billing.paymentsDate') return 'Sana';
    if (opts?.defaultValue) return opts.defaultValue;
    return key;
  };

  const mockMoney = (val) => `${Number(val || 0).toLocaleString()}`;
  const mockFormatDateTime = (val) => `formatted-${val}`;

  it('renders loading state properly', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingPaymentsList, {
        t: mockT,
        money: mockMoney,
        formatDateTime: mockFormatDateTime,
        loading: true,
      })
    );
    expect(html).toContain('Yuklanmoqda...');
  });

  it('renders empty state when rows is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingPaymentsList, {
        t: mockT,
        money: mockMoney,
        formatDateTime: mockFormatDateTime,
        rows: [],
      })
    );
    expect(html).toContain("To&#x27;lovlar topilmadi");
  });

  it('renders table rows with correct dark mode classes and amounts', () => {
    const rows = [
      {
        id: 'pay-1',
        provider: 'Payme',
        amount: 10000,
        status: 'PAID',
        paidAt: '2026-10-27T10:00:00Z',
      },
      {
        id: 'pay-2',
        provider: 'Click',
        amount: 50000,
        status: 'CANCELLED',
        createdAt: '2026-10-26T10:00:00Z',
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(BillingPaymentsList, {
        t: mockT,
        money: mockMoney,
        formatDateTime: mockFormatDateTime,
        rows,
      })
    );

    expect(html).toContain('billing-table');
    expect(html).toContain('dark:text-slate-100');
    expect(html).toContain('Payme');
    expect(html).toContain('10,000');
    expect(html).toContain('Click');
    expect(html).toContain('50,000');
    expect(html).toContain('billing-badge--ACTIVE');
    expect(html).toContain('billing-badge--BLOCKED');
  });
});

import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

globalThis.React = React;

let mockReportsQuery = {
  isLoading: false,
  data: {
    revenue: { today: 1200000, week: 8500000, month: 34000000, year: 240000000 },
    expected: { today: 400000, next7Days: 2800000, next30Days: 12000000 },
    debt: { total: 4500000, count: 3, average: 1500000 },
    methods: [
      { method: 'CLICK', amount: 18000000, percent: 53 },
      { method: 'PAYME', amount: 10000000, percent: 29 },
      { method: 'BANK_TRANSFER', amount: 6000000, percent: 18 },
    ],
  },
};

let mockCompaniesQuery = {
  isLoading: false,
  data: [
    {
      billing: {
        companyId: 101,
        companyName: 'Test Tech MCHJ',
        planName: 'Pro',
        monthlyTotal: 500000,
        balance: -200000,
        nextChargeAt: '2026-10-25T00:00:00Z',
      },
      paymentState: 'OVERDUE',
      daysUntilDue: -2,
    },
    {
      billing: {
        companyId: 102,
        companyName: 'Future Logistics',
        planName: 'Enterprise',
        monthlyTotal: 1200000,
        balance: 300000,
        nextChargeAt: '2026-10-30T00:00:00Z',
      },
      paymentState: 'DUE_SOON',
      daysUntilDue: 3,
    },
  ],
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => {
    if (queryKey.includes('reports')) return mockReportsQuery;
    if (queryKey.includes('actionable-ledger')) return mockCompaniesQuery;
    return { isLoading: false, data: null };
  },
}));

vi.mock('../../../../api', () => ({
  platformBillingApi: {
    collectionsReports: vi.fn(),
    collectionsCompanies: vi.fn(),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => React.createElement('div', { className: 'mock-recharts-container' }, children),
  BarChart: ({ children }) => React.createElement('div', { className: 'mock-bar-chart' }, children),
  Bar: () => React.createElement('div', { className: 'mock-bar' }),
  XAxis: () => React.createElement('div', { className: 'mock-xaxis' }),
  YAxis: () => React.createElement('div', { className: 'mock-yaxis' }),
  CartesianGrid: () => React.createElement('div', { className: 'mock-grid' }),
  Tooltip: () => React.createElement('div', { className: 'mock-tooltip' }),
  Legend: () => React.createElement('div', { className: 'mock-legend' }),
}));

import BillingReportsView from './BillingReportsView';

describe('BillingReportsView', () => {
  const mockT = (key, opts) => opts?.defaultValue || key;
  const mockMoney = (val) => Number(val || 0).toLocaleString('ru-RU');
  const mockP = {
    formatDate: (d) => (d ? '2026-10-25' : '—'),
    selectCompany: vi.fn(),
    openPaymentModal: vi.fn(),
    actions: { exporting: false, exportExcel: vi.fn() },
  };

  it('renders loading state when query is loading', () => {
    mockReportsQuery = { isLoading: true, data: null };
    const html = renderToStaticMarkup(
      React.createElement(BillingReportsView, { t: mockT, money: mockMoney, p: mockP })
    );
    expect(html).toContain('common.loading');
  });

  it('renders error message when reports data is null', () => {
    mockReportsQuery = { isLoading: false, data: null };
    const html = renderToStaticMarkup(
      React.createElement(BillingReportsView, { t: mockT, money: mockMoney, p: mockP })
    );
    expect(html).toContain('platform.billing.actionFailed');
  });

  it('renders full Executive Financial Dashboard with KPIs, Charts, Methods, and Actionable Ledger', () => {
    mockReportsQuery = {
      isLoading: false,
      data: {
        revenue: { today: 1200000, week: 8500000, month: 34000000, year: 240000000 },
        expected: { today: 400000, next7Days: 2800000, next30Days: 12000000 },
        debt: { total: 4500000, count: 3, average: 1500000 },
        methods: [
          { method: 'CLICK', amount: 18000000, percent: 53 },
          { method: 'PAYME', amount: 10000000, percent: 29 },
        ],
      },
    };
    mockCompaniesQuery = {
      isLoading: false,
      data: [
        {
          billing: {
            companyId: 101,
            companyName: 'Test Tech MCHJ',
            planName: 'Pro',
            monthlyTotal: 500000,
            balance: -200000,
            nextChargeAt: '2026-10-25T00:00:00Z',
          },
          paymentState: 'OVERDUE',
          daysUntilDue: -2,
        },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(BillingReportsView, { t: mockT, money: mockMoney, p: mockP })
    );

    // 1. Dashboard root
    expect(html).toContain('bc-reports-dashboard');

    // 2. 4 ta KPI kartochkasi
    expect(html).toContain('bc-report-kpi-card--revenue');
    expect(html).toContain('bc-report-kpi-card--expected');
    expect(html).toContain('bc-report-kpi-card--debt');
    expect(html).toContain('bc-report-kpi-card--methods');
    expect(html).toContain('34\u00A0000\u00A0000'); // Month revenue formatted
    expect(html).toContain('4\u00A0500\u00A0000'); // Debt total formatted

    // 3. O'rta qator: Dinamika grafigi va To'lov usullari
    expect(html).toContain('bc-reports-middle-grid');
    expect(html).toContain('bc-chart-card');
    expect(html).toContain('mock-bar-chart');
    expect(html).toContain('bc-methods');
    expect(html).toContain('CLICK');
    expect(html).toContain('PAYME');

    // 4. Pastki qavat: Actionable Ledger jadvali
    expect(html).toContain('bc-ledger-card');
    expect(html).toContain('bc-ledger-tabs');
    expect(html).toContain('Test Tech MCHJ');
    expect(html).toContain('Pro');
    expect(html).toContain('ID: 101');
    expect(html).toContain('To‘lov qo‘shish');
  });
});

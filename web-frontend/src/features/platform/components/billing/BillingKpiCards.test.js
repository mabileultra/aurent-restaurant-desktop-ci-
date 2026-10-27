import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BillingKpiCards from './BillingKpiCards';

globalThis.React = React;

describe('BillingKpiCards', () => {
  const mockOverview = {
    totalCompanies: 102,
    activeCount: 8,
    overdueCount: 3,
    dueSoonCount: 5,
    newCompanies: 15,
    suspendedCount: 2,
    mrr: 200000,
    debtTotal: 50000,
    expectedSoonAmount: 30000,
    newCompanyDays: 7,
  };

  const mockT = (key, opts) => {
    if (key === 'billing.currency') return 'so‘m';
    if (key.includes('kpi.ALL')) return 'Jami kompaniyalar';
    if (key.includes('kpi.ACTIVE')) return 'Faol to‘lovchilar';
    if (key.includes('kpi.OVERDUE')) return 'Qarzdorlar';
    if (key.includes('kpi.DUE_SOON')) return 'Tez kunda muddat';
    if (key.includes('kpi.NEW')) return 'Yangi kompaniyalar';
    if (key.includes('kpi.SUSPENDED')) return 'To‘xtatilgan';
    if (opts?.defaultValue) return opts.defaultValue;
    return key;
  };

  it('renders all 6 interactive filter cards with accurate counts', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingKpiCards, {
        t: mockT,
        money: (v) => `${v}`,
        overview: mockOverview,
        tab: 'ALL',
        onTab: vi.fn(),
      })
    );

    // Must contain 6 cards
    expect(html).toContain('Jami kompaniyalar');
    expect(html).toContain('102');
    expect(html).toContain('Faol to‘lovchilar');
    expect(html).toContain('Qarzdorlar');
    expect(html).toContain('Tez kunda muddat');
    expect(html).toContain('Yangi kompaniyalar');
    expect(html).toContain('To‘xtatilgan');

    // ALL is active
    expect(html).toContain('bc-kpi--active');
    expect(html).toContain('bc-kpi__active-bar');
    expect(html).toContain('role="tab"');
  });

  it('marks selected tab as active', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingKpiCards, {
        t: mockT,
        money: (v) => `${v}`,
        overview: mockOverview,
        tab: 'ACTIVE',
        onTab: vi.fn(),
      })
    );

    expect(html).toContain('aria-selected="true"');
  });
});

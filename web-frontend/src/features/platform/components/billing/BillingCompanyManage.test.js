import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BillingCompanyManage from './BillingCompanyManage';

globalThis.React = React;

describe('BillingCompanyManage', () => {
  const createMockP = (overrides = {}) => ({
    t: (key, opts) => opts?.defaultValue || key,
    money: (v) => `${v} sum`,
    monthlyAmount: '500 000',
    setMonthlyAmount: vi.fn(),
    assignPlanId: 'plan-1',
    pickPlan: vi.fn(),
    plans: [
      { id: 'plan-1', name: 'Start', monthlyPrice: 500000 },
      { id: 'plan-2', name: 'Pro', monthlyPrice: 900000 },
    ],
    periodStartOn: '2026-11-01',
    setPeriodStartOn: vi.fn(),
    dateLocale: 'uz',
    prepaidCover: null,
    busy: false,
    monthlyAmountValid: true,
    periodStartValid: true,
    assignPlan: vi.fn(),
    adjustAmount: '100 000',
    setAdjustAmount: vi.fn(),
    adjustNote: 'Bonus payment',
    setAdjustNote: vi.fn(),
    adjustAmountValid: true,
    credit: vi.fn(),
    debit: vi.fn(),
    selected: {
      id: 1,
      companyId: 1,
      status: 'ACTIVE',
    },
    unblock: vi.fn(),
    block: vi.fn(),
    ...overrides,
  });

  it('renders monthly amount and top-up form fields with active status', () => {
    const p = createMockP();
    const html = renderToStaticMarkup(React.createElement(BillingCompanyManage, { p }));

    expect(html).toContain('platform.billing.monthlyAmount');
    expect(html).toContain('value="500 000"');
    expect(html).toContain('Start — 500000 sum');
    expect(html).toContain('Pro — 900000 sum');
    expect(html).toContain('platform.billing.saveMonthly');
    expect(html).toContain('value="100 000"');
    expect(html).toContain('value="Bonus payment"');
    expect(html).toContain('platform.billing.credit');
    expect(html).toContain('platform.billing.debit');
    expect(html).toContain('platform.billing.block');
    expect(html).not.toContain('platform.billing.unblock');
  });

  it('renders unblock button when company status is BLOCKED', () => {
    const p = createMockP({
      selected: { id: 1, status: 'BLOCKED' },
    });
    const html = renderToStaticMarkup(React.createElement(BillingCompanyManage, { p }));

    expect(html).toContain('platform.billing.unblock');
    expect(html).not.toContain('platform.billing.block');
  });

  it('renders prepaid cover status messages for ok, empty, and zero kinds', () => {
    const htmlOk = renderToStaticMarkup(
      React.createElement(BillingCompanyManage, {
        p: createMockP({
          prepaidCover: { kind: 'ok', days: 15 },
        }),
      })
    );
    expect(htmlOk).toContain('platform.billing.prepaidHint');

    const htmlEmpty = renderToStaticMarkup(
      React.createElement(BillingCompanyManage, {
        p: createMockP({
          prepaidCover: { kind: 'empty' },
        }),
      })
    );
    expect(htmlEmpty).toContain('platform.billing.prepaidHintEmpty');

    const htmlZero = renderToStaticMarkup(
      React.createElement(BillingCompanyManage, {
        p: createMockP({
          prepaidCover: { kind: 'zero' },
        }),
      })
    );
    expect(htmlZero).toContain('platform.billing.prepaidHintZero');
  });

  it('disables save button when busy or invalid', () => {
    const htmlInvalid = renderToStaticMarkup(
      React.createElement(BillingCompanyManage, {
        p: createMockP({ monthlyAmountValid: false }),
      })
    );
    expect(htmlInvalid).toContain('disabled');

    const htmlBusy = renderToStaticMarkup(
      React.createElement(BillingCompanyManage, {
        p: createMockP({ busy: true }),
      })
    );
    expect(htmlBusy).toContain('disabled');
  });

  it('disables topup buttons when adjustAmountValid is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCompanyManage, {
        p: createMockP({ adjustAmountValid: false }),
      })
    );
    expect(html).toMatch(/<button[^>]*disabled[^>]*>platform\.billing\.credit<\/button>/);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>platform\.billing\.debit<\/button>/);
  });
});

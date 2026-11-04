import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BillingCompanyDrawer from './BillingCompanyDrawer';

globalThis.React = React;

vi.mock('../../../shared/geo/useGeoNameLookup', () => ({
  useGeoNameLookup: () => ({
    regionName: () => 'Samarqand viloyati',
    districtName: () => 'Samarqand sh.',
  }),
}));

describe('BillingCompanyDrawer', () => {
  const mockP = {
    t: (key) => key,
    money: (v) => `${v}`,
    formatDate: (d) => `date-${d}`,
    formatDateTime: (d) => `datetime-${d}`,
    selectedRow: {
      id: 1,
      companyName: 'Mironkul Agro',
      companyPhone: '+998901234567',
      paymentState: 'ACTIVE',
      regionCode: 'SAM',
      districtCode: 'SAM_SH',
    },
    selected: {
      companyId: 1,
      companyName: 'Mironkul Agro',
      balance: 100000,
      planName: 'Standard',
      monthlyTotal: 50000,
    },
    drawerTab: 'overview',
    paymentModalOpen: false,
    closeDrawer: vi.fn(),
    openPaymentModal: vi.fn(),
    actions: {
      remindTelegram: vi.fn(),
    },
    ledger: [],
    companyPayments: [],
  };

  it('renders drawer when company is selected and paymentModalOpen is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCompanyDrawer, { p: mockP })
    );

    expect(html).toContain('Mironkul Agro');
    expect(html).toContain('Standard');
    expect(html).toContain('role="dialog"');
  });

  it('returns null and does NOT render drawer when paymentModalOpen is true (modal transition)', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCompanyDrawer, {
        p: { ...mockP, paymentModalOpen: true },
      })
    );

    expect(html).toBe('');
  });
});

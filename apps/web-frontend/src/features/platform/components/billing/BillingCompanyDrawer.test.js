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

  it('renders STIR from row or companyDetail fallback when companyTin is provided', () => {
    const pWithTin = {
      ...mockP,
      selectedRow: { ...mockP.selectedRow, companyTin: '123456789' },
    };
    const html = renderToStaticMarkup(React.createElement(BillingCompanyDrawer, { p: pWithTin }));
    expect(html).toContain('123456789');
  });

  it('renders STIR from companyDetail if row.companyTin is missing', () => {
    const pWithDetail = {
      ...mockP,
      selectedRow: { ...mockP.selectedRow, companyTin: undefined, companyPhone: undefined },
      companyDetail: { tin: '987654321', phone: '+998991112233' },
    };
    const html = renderToStaticMarkup(React.createElement(BillingCompanyDrawer, { p: pWithDetail }));
    expect(html).toContain('987654321');
    expect(html).toContain('+998991112233');
  });

  it('displays "Maxsus tarif" when planName is absent but monthlyTotal > 0', () => {
    const pCustom = {
      ...mockP,
      selected: { ...mockP.selected, planName: null, monthlyTotal: 75000 },
    };
    const html = renderToStaticMarkup(React.createElement(BillingCompanyDrawer, { p: pCustom }));
    expect(html).toContain('Maxsus tarif');
    expect(html).not.toContain('Tarifsiz rejim');
  });

  it('displays "Tarifsiz rejim" only when both planName is absent and monthlyTotal === 0', () => {
    const pNoPlan = {
      ...mockP,
      selected: { ...mockP.selected, planName: null, monthlyTotal: 0 },
    };
    const html = renderToStaticMarkup(React.createElement(BillingCompanyDrawer, { p: pNoPlan }));
    expect(html).toContain('Tarifsiz rejim');
  });
});

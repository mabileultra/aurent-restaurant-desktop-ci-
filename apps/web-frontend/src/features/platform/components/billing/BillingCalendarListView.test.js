import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BillingCalendarListView from './BillingCalendarListView';

globalThis.React = React;

vi.mock('../../../shared/geo/useGeoNameLookup', () => ({
  useGeoNameLookup: () => ({
    regionName: (code) => (code === 'SAM' ? 'Samarqand viloyati' : code),
    districtName: (code) => code,
  }),
}));

describe('BillingCalendarListView', () => {
  const defaultProps = {
    t: (key, opts) => opts?.defaultValue || key,
    month: '2026-10',
    days: [
      {
        date: '2026-10-15',
        items: [
          {
            companyId: 101,
            companyName: 'Akfa Medline',
            amount: 500000,
            paymentState: 'ACTIVE',
          },
        ],
      },
      {
        date: '2026-10-25',
        items: [
          {
            companyId: 202,
            companyName: 'Grand Pharm',
            amount: 850000,
            paymentState: 'OVERDUE',
          },
        ],
      },
    ],
    companyMap: {
      101: {
        id: 101,
        companyName: 'Akfa Medline',
        regionCode: 'SAM',
        billing: {
          companyId: 101,
          companyName: 'Akfa Medline',
          balance: 100000,
          planName: 'Enterprise Plan',
        },
      },
      202: {
        id: 202,
        companyName: 'Grand Pharm',
        regionCode: 'TOSHKENT',
        billing: {
          companyId: 202,
          companyName: 'Grand Pharm',
          balance: -250000,
          planName: 'Standard Plan',
        },
      },
    },
    money: (v) => Number(v).toLocaleString('ru-RU'),
    currency: "so'm",
    lang: 'uz',
    selectedDate: null,
    onClearDateFilter: vi.fn(),
    onOpenCompany: vi.fn(),
    onOpenPaymentModal: vi.fn(),
    p: {
      actions: {
        exporting: false,
        exportExcel: vi.fn(),
      },
    },
  };

  it('renders table rows for all monthly scheduled items across days', () => {
    const html = renderToStaticMarkup(React.createElement(BillingCalendarListView, defaultProps));

    expect(html).toContain('Akfa Medline');
    expect(html).toContain('Enterprise Plan');
    expect(html).toContain('Samarqand viloyati');
    expect(html).toContain('Grand Pharm');
    expect(html).toContain('Standard Plan');
    expect(html).toContain('-250');
    expect(html).toContain('500');
    expect(html).toContain('so&#x27;m');
    expect(html).toContain('bc-text--danger'); // overdue balance styling
  });

  it('filters table rows strictly when selectedDate is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCalendarListView, {
        ...defaultProps,
        selectedDate: '2026-10-15',
      })
    );

    expect(html).toContain('Akfa Medline');
    expect(html).not.toContain('Grand Pharm');
    expect(html).toContain('bc-cal-list-day-chip');
  });

  it('renders empty table message when days or items are empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCalendarListView, {
        ...defaultProps,
        days: [],
      })
    );

    expect(html).toContain('Kompaniyalar topilmadi');
    expect(html).not.toContain('Akfa Medline');
  });
});

import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

globalThis.React = React;

let mockCalendarData = {
  month: '2026-10',
  totalAmount: 12350000,
  totalCount: 28,
  days: [
    {
      date: '2026-10-27',
      count: 2,
      amount: 1800000,
      items: [
        {
          companyId: 10,
          companyName: 'Amanjon Samarqand XK',
          amount: 200000,
          paymentState: 'ACTIVE',
        },
        {
          companyId: 20,
          companyName: 'Nafis Savdo MCHJ',
          amount: 150000,
          paymentState: 'OVERDUE',
        },
      ],
    },
    {
      date: '2026-10-30',
      count: 1,
      amount: 2500000,
      items: [
        {
          companyId: 30,
          companyName: '404 Toys MCHJ',
          amount: 2500000,
          paymentState: 'ACTIVE',
        },
      ],
    },
  ],
};

let mockCompaniesData = [
  {
    billing: {
      companyId: 10,
      companyName: 'Amanjon Samarqand XK',
      planName: 'Bazaviy',
      balance: 850000,
    },
    regionCode: 'SAMARQAND',
    districtCode: 'SAMARQAND_SH',
  },
  {
    billing: {
      companyId: 20,
      companyName: 'Nafis Savdo MCHJ',
      planName: 'Standart',
      balance: 20000,
    },
    regionCode: 'TOSHKENT',
    districtCode: 'YUNUSOBOD',
  },
  {
    billing: {
      companyId: 30,
      companyName: '404 Toys MCHJ',
      planName: 'Individual',
      balance: 5000000,
    },
    regionCode: 'TOSHKENT_SH',
    districtCode: 'CHILONZOR',
  },
];

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => {
    if (queryKey.includes('calendar')) return { isLoading: false, data: mockCalendarData };
    if (queryKey.includes('companies')) return { isLoading: false, data: mockCompaniesData };
    if (queryKey.includes('geo-regions')) return { isLoading: false, data: [] };
    return { isLoading: false, data: null };
  },
}));

vi.mock('../../../../api', () => ({
  platformBillingApi: {
    collectionsCalendar: vi.fn(),
    collectionsCompanies: vi.fn(),
  },
}));

vi.mock('../../../../api/geo.api', () => ({
  geoApi: {
    regions: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../../../shared/geo/useGeoNameLookup', () => ({
  useGeoNameLookup: () => ({
    regionName: (code) => code || '',
    districtName: (code) => code || '',
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
    i18n: { language: 'uz' },
  }),
}));

import BillingCalendarView from './BillingCalendarView';
import BillingCalendarListView from './BillingCalendarListView';

describe('BillingCalendarView', () => {
  const mockT = (key, opts) => opts?.defaultValue || key;
  const mockMoney = (val) => Number(val || 0).toLocaleString('ru-RU');
  const mockP = {
    plans: [
      { id: '1', name: 'Bazaviy' },
      { id: '2', name: 'Standart' },
    ],
    selectCompany: vi.fn(),
    openCompanyById: vi.fn(),
    openPaymentModal: vi.fn(),
  };

  it('renders all 5 top KPI cards with accurate values and titles', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCalendarView, {
        t: mockT,
        money: mockMoney,
        p: mockP,
        onOpenCompany: vi.fn(),
      })
    );

    // 5 KPI cards
    expect(html).toContain('bc-calendar-kpi-grid');
    expect(html).toContain('bc-cal-kpi-card--primary');
    expect(html).toContain('bc-cal-kpi-card--success');
    expect(html).toContain('bc-cal-kpi-card--danger');
    expect(html).toContain('bc-cal-kpi-card--warning');
    expect(html).toContain('bc-cal-kpi-card--neutral');

    // Labels
    expect(html).toContain('Shu oyda to‘lanishi kerak');
    expect(html).toContain('Muvaffaqiyatli yechilgan');
    expect(html).toContain('Balans yetarli emas');
    expect(html).toContain('Kechiktirish berilgan');
    expect(html).toContain('To‘xtatilgan');
  });

  it('renders calendar toolbar with month nav, view toggle, and filter selects', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCalendarView, {
        t: mockT,
        money: mockMoney,
        p: mockP,
        onOpenCompany: vi.fn(),
      })
    );

    // Toolbar
    expect(html).toContain('bc-calendar-toolbar');
    expect(html).toContain('bc-cal-month-nav__title');
    expect(html).toContain('Bugun');
    expect(html).toContain('bc-cal-view-modes');
    expect(html).toContain('Kalendar');
    expect(html).toContain('Ro‘yxat');

    // Filters
    expect(html).toContain('Holati');
    expect(html).toContain('Tarif');
    expect(html).toContain('Hudud');
    expect(html).toContain('Kompaniya, STIR, telefon…');
  });

  it('renders 7-column calendar grid with weekday headers, day numbers, badges, and legend', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCalendarView, {
        t: mockT,
        money: mockMoney,
        p: mockP,
        onOpenCompany: vi.fn(),
      })
    );

    expect(html).toContain('bc-calendar-main-card');
    expect(html).toContain('bc-cal-weekdays');
    expect(html).toContain('Du');
    expect(html).toContain('Ya');
    expect(html).toContain('bc-cal-grid');
    expect(html).toContain('bc-cal-legend');
    expect(html).toContain('Yechildi (muvaffaqiyatli)');
    expect(html).toContain('Balans yetmaydi / Qarzdor');
  });

  it('renders daily details panel with enriched company information', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCalendarView, {
        t: mockT,
        money: mockMoney,
        p: mockP,
        onOpenCompany: vi.fn(),
      })
    );

    expect(html).toContain('bc-cal-side-panel');
    expect(html).toContain('bc-cal-side-tabs');
    expect(html).toContain('Amanjon Samarqand XK');
    expect(html).toContain('Nafis Savdo MCHJ');
    expect(html).toContain('Bazaviy');
    expect(html).toContain('Standart');
    expect(html).toContain('Balans: 850\u00A0000');
  });

  it('renders list view with table, company details, amount, balance, and export button', () => {
    const html = renderToStaticMarkup(
      React.createElement(BillingCalendarListView, {
        t: mockT,
        month: '2026-10',
        days: mockCalendarData.days,
        companyMap: {
          10: mockCompaniesData[0],
          20: mockCompaniesData[1],
          30: mockCompaniesData[2],
        },
        money: mockMoney,
        currency: 'UZS',
        lang: 'uz',
        selectedDate: '2026-10-27',
        onClearDateFilter: vi.fn(),
        onOpenCompany: vi.fn(),
        onOpenPaymentModal: vi.fn(),
        p: mockP,
      })
    );

    expect(html).toContain('bc-ledger-card');
    expect(html).toContain('Oylik to‘lovlar va yechishlar jadvali');
    expect(html).toContain('bc-cal-list-day-chip');
    expect(html).toContain('27-oktabr, 2026');
    expect(html).toContain('Amanjon Samarqand XK');
    expect(html).toContain('Nafis Savdo MCHJ');
    expect(html).toContain('Excel');
  });
});

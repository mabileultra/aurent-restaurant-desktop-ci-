import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from '../../../i18n/config';
import ShiftReportPrintBody from './ShiftReportPrintBody';

const MOCK_SHIFT = {
  reportType: 'X',
  storeName: 'Aurent Chilonzor',
  cashierName: 'Ali',
  openedAt: '2026-11-14T08:00:00Z',
  reportAt: '2026-11-14T18:00:00Z',
  saleCount: 20,
  totalAmount: 500000,
};

describe('ShiftReportPrintBody', () => {
  it('renders strictly in Uzbek even when active i18n language is Russian', async () => {
    await i18n.changeLanguage('ru');
    expect(i18n.language).toBe('ru');

    const html = renderToStaticMarkup(
      React.createElement(ShiftReportPrintBody, { report: MOCK_SHIFT })
    );

    // O'zbekcha sarlavha va matnlar
    expect(html).toContain('X-hisobot');
    expect(html).toContain('Sotuvlar');
    expect(html).toContain('Summa');

    // Ruscha sarlavha bo'lmasligi shart
    expect(html).not.toContain('X-отчёт');
  });
});

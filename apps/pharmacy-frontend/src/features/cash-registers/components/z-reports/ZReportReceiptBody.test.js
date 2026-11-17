import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from '../../../../i18n/config';
import ZReportReceiptBody from './ZReportReceiptBody';

const MOCK_Z = {
  zNumber: 10,
  terminalSerial: 'TERM-001',
  appletVer: '1.0',
  employeeName: 'Kassir',
  storeName: 'Aurent Apteka',
  cashTotal: 100000,
  cardTotal: 50000,
  totalAmount: 150000,
  salesCount: 5,
};

describe('ZReportReceiptBody (pharmacy-frontend)', () => {
  it('renders strictly in Uzbek even when active i18n language is Russian', async () => {
    await i18n.changeLanguage('ru');
    expect(i18n.language).toBe('ru');

    const html = renderToStaticMarkup(
      React.createElement(ZReportReceiptBody, { z: MOCK_Z })
    );

    // O'zbekcha sarlavha va matnlar
    expect(html).toContain('Z-hisobot');
    expect(html).toContain('Naqd hisob-kitob summasi');
    expect(html).toContain('Jami');

    // Ruscha sarlavha bo'lmasligi shart
    expect(html).not.toContain('Z-отчёт');
    expect(html).not.toContain('Итого');
  });
});

import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from '../../i18n/config';
import FiscalReceiptBody from './FiscalReceiptBody';

const MOCK_SALE = {
  id: 'sale-ph-123',
  receiptNumber: 'CHK-0001',
  createdAt: '2026-11-16T12:00:00Z',
  cashierName: 'Aziz',
  paymentMethod: 'CASH',
  paidCash: 50000,
  paidCard: 0,
  totalAmount: 50000,
  items: [
    {
      id: 'item-1',
      productName: 'Paratsetamol',
      quantity: 2,
      price: 25000,
      total: 50000,
    },
  ],
};

describe('FiscalReceiptBody (pharmacy-frontend)', () => {
  it('renders strictly in Uzbek even when active i18n language is Russian', async () => {
    await i18n.changeLanguage('ru');
    expect(i18n.language).toBe('ru');

    const html = renderToStaticMarkup(
      React.createElement(FiscalReceiptBody, { sale: MOCK_SALE })
    );

    // O'zbekcha so'zlar bo'lishi shart
    expect(html).toContain('Jami');
    expect(html).toContain('Naqd');
    expect(html).toContain('Xaridingiz uchun rahmat');

    // Ruscha so'zlar bo'lmasligi shart
    expect(html).not.toContain('Итого');
    expect(html).not.toContain('Наличные');
  });
});

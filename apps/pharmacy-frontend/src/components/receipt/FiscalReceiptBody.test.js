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

  it('does NOT render card rows (Karta turi, Ijtimoiy karta, RRN) for pure cash payment', async () => {
    await i18n.changeLanguage('ru');
    const html = renderToStaticMarkup(
      React.createElement(FiscalReceiptBody, {
        sale: {
          ...MOCK_SALE,
          paymentMethod: 'CASH',
          paidCash: 50000,
          paidCard: 0,
        },
      })
    );

    expect(html).toContain('Naqd');
    expect(html).not.toContain('Karta turi');
    expect(html).not.toContain('Ijtimoiy karta');
    expect(html).not.toContain('RRN');
  });

  it('renders 3 card rows in Uzbek for card payment even when UI language is Russian', async () => {
    await i18n.changeLanguage('ru');
    const cardSale = {
      ...MOCK_SALE,
      paymentMethod: 'CARD',
      cardType: 'HUMO',
      cardCategory: 'SOCIAL',
      socialCardNumber: '9860031122338031',
      rrn: '631810177451',
      paidCash: 0,
      paidCard: 50000,
    };

    const html = renderToStaticMarkup(
      React.createElement(FiscalReceiptBody, { sale: cardSale })
    );

    expect(html).toContain('Plastik');
    expect(html).toContain('Karta turi');
    expect(html).toContain('Ijtimoiy');
    expect(html).toContain('Ijtimoiy karta');
    expect(html).toContain('9860********8031');
    expect(html).toContain('RRN');
    expect(html).toContain('631810177451');

    expect(html).not.toContain('Тип карты');
    expect(html).not.toContain('Социальная карта');
    expect(html).not.toContain('Социальная');
  });

  it('renders cash and card details for mixed payment', async () => {
    await i18n.changeLanguage('ru');
    const mixedSale = {
      ...MOCK_SALE,
      paymentMethod: 'MIXED',
      cashAmount: 20000,
      cardAmount: 30000,
      cardType: 'HUMO',
      cardCategory: 'SOCIAL',
      socialCardNumber: '9860031122338031',
      rrn: '631810177451',
      paidCash: 20000,
      paidCard: 30000,
    };

    const html = renderToStaticMarkup(
      React.createElement(FiscalReceiptBody, { sale: mixedSale })
    );

    expect(html).toContain('Naqd');
    expect(html).toContain('Plastik');
    expect(html).toContain('Karta turi');
    expect(html).toContain('Ijtimoiy');
    expect(html).toContain('Ijtimoiy karta');
    expect(html).toContain('9860********8031');
    expect(html).toContain('RRN');
    expect(html).toContain('631810177451');
  });

  it('renders electronic prescription number as a separate Uzbek row', async () => {
    await i18n.changeLanguage('ru');
    const html = renderToStaticMarkup(
      React.createElement(FiscalReceiptBody, { sale: { ...MOCK_SALE, prescriptionNumber: 'RX-2026-0042' } })
    );
    expect(html).toContain('Elektron retsept');
    expect(html).toContain('RX-2026-0042');
    expect(html).not.toContain('Электронный рецепт');
  });

  it('does NOT take the prescription number from sale notes', () => {
    const html = renderToStaticMarkup(
      React.createElement(FiscalReceiptBody, { sale: { ...MOCK_SALE, notes: 'PAY:cash | RX:RX-2026-0042' } })
    );
    expect(html).not.toContain('Elektron retsept');
  });

  it('does NOT render prescription row for a sale without prescription number', () => {
    const html = renderToStaticMarkup(
      React.createElement(FiscalReceiptBody, { sale: MOCK_SALE })
    );
    expect(html).not.toContain('Elektron retsept');
  });
});

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PharmacyPayRail from './PharmacyPayRail';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      const map = {
        'pos.discount': 'Chegirma',
        'pos.return': 'Qaytarish',
        'pos.cashIn': 'Kirim',
        'pos.cashOut': 'Chiqim',
      };
      return map[key] || opts?.defaultValue || key;
    },
    i18n: { language: 'uz' },
  }),
}));

vi.mock('../hooks/usePharmacyPayRail', () => ({
  usePharmacyPayRail: () => ({
    method: 'cash',
    setMethod: vi.fn(),
    cashInput: '',
    setCashInput: vi.fn(),
    setExactAmount: vi.fn(),
    clearCash: vi.fn(),
    toPay: 50000,
    quickCash: [],
    changeDue: 0,
    cardRemainder: 0,
    cashPaidEnough: false,
    hasPartialCash: false,
    cardPayBlocked: false,
    saleDisabled: false,
    printReceiptEnabled: true,
    handlePrintReceiptChange: vi.fn(),
    submitSale: vi.fn(),
    submitCard: vi.fn(),
  }),
}));

describe('PharmacyPayRail Cash Movement Buttons', () => {
  it('omits cash movement buttons when onCashIn and onCashOut are not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PharmacyPayRail, {
        total: 50000,
        onDiscount: vi.fn(),
        onReturn: vi.fn(),
      })
    );

    expect(html).toContain('Chegirma');
    expect(html).toContain('Qaytarish');
    expect(html).not.toContain('pharmacy-pay-rail__tool--cash-in');
    expect(html).not.toContain('pharmacy-pay-rail__tool--cash-out');
  });

  it('renders Kirim and Chiqim buttons when onCashIn and onCashOut are provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PharmacyPayRail, {
        total: 50000,
        onDiscount: vi.fn(),
        onReturn: vi.fn(),
        onCashIn: vi.fn(),
        onCashOut: vi.fn(),
      })
    );

    expect(html).toContain('pharmacy-pay-rail__tool--cash-in');
    expect(html).toContain('pharmacy-pay-rail__tool--cash-out');
    expect(html).toContain('Kirim');
    expect(html).toContain('Chiqim');
  });
});

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PosRegisterPayRail from './PosRegisterPayRail';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      const map = {
        'pos.discount': 'Chegirma',
        'pos.return': 'Qaytarish',
        'pos.cashIn': 'Kirim',
        'pos.cashOut': 'Chiqim',
        'pos.paymentTitle': 'To‘lov paneli',
      };
      return map[key] || opts?.defaultValue || key;
    },
    i18n: { language: 'uz' },
  }),
}));

vi.mock('../../hooks/usePosRegisterPayRail', () => ({
  usePosRegisterPayRail: () => ({
    toPay: 100000,
    tendered: '',
    changeDue: 0,
    cashPaidEnough: false,
    cardRemainder: 0,
    hasPartialCash: false,
    cardPayBlocked: false,
    saleDisabled: false,
    printReceiptEnabled: true,
    setTendered: vi.fn(),
    submitCash: vi.fn(),
    submitCashless: vi.fn(),
    submitCard: vi.fn(),
    submitCorporate: vi.fn(),
    openCredit: vi.fn(),
    openAdvance: vi.fn(),
    handlePrintReceiptChange: vi.fn(),
  }),
}));

describe('PosRegisterPayRail Cash Movement Buttons', () => {
  it('renders discount and return tools, but omits cash movement buttons when callbacks are omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(PosRegisterPayRail, {
        total: 100000,
        onDiscount: vi.fn(),
        onReturn: vi.fn(),
      })
    );

    expect(html).toContain('pos-register-pay-rail__tool--discount');
    expect(html).toContain('pos-register-pay-rail__tool--return');
    expect(html).not.toContain('pos-register-pay-rail__tool--cash-in');
    expect(html).not.toContain('pos-register-pay-rail__tool--cash-out');
  });

  it('renders cash in and cash out buttons when onCashIn and onCashOut callbacks are provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PosRegisterPayRail, {
        total: 100000,
        onDiscount: vi.fn(),
        onReturn: vi.fn(),
        onCashIn: vi.fn(),
        onCashOut: vi.fn(),
      })
    );

    expect(html).toContain('pos-register-pay-rail__tool--cash-in');
    expect(html).toContain('pos-register-pay-rail__tool--cash-out');
    expect(html).toContain('Kirim');
    expect(html).toContain('Chiqim');
  });

  it('does not render tools area when hideTools is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PosRegisterPayRail, {
        total: 100000,
        hideTools: true,
        onDiscount: vi.fn(),
        onReturn: vi.fn(),
        onCashIn: vi.fn(),
        onCashOut: vi.fn(),
      })
    );

    expect(html).not.toContain('pos-register-pay-rail__tools');
    expect(html).not.toContain('pos-register-pay-rail__tool--cash-in');
  });
});

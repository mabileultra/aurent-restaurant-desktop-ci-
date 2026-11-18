import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from '../../i18n/config';
import FiscalReceiptBody from './FiscalReceiptBody';

const MOCK_SALE = {
  id: 'sale-123',
  receiptNumber: 'CHK-0001',
  createdAt: '2026-11-14T12:00:00Z',
  cashierName: 'Aziz',
  paymentMethod: 'CASH',
  paidCash: 50000,
  paidCard: 0,
  totalAmount: 50000,
  items: [
    {
      id: 'item-1',
      productName: 'Non',
      quantity: 2,
      price: 25000,
      total: 50000,
    },
  ],
};

describe('FiscalReceiptBody', () => {
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

    // Karta qatorlari majburiy o'zbekcha chiqishi shart
    expect(html).toContain('Plastik');
    expect(html).toContain('Karta turi');
    expect(html).toContain('Ijtimoiy');
    expect(html).toContain('Ijtimoiy karta');
    expect(html).toContain('9860********8031');
    expect(html).toContain('RRN');
    expect(html).toContain('631810177451');

    // Ruscha bo'lmasligi shart
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

  describe('FiscalReceiptBody: QR code suppression for ADVANCE and CREDIT (AUR-4)', () => {
    const FISCAL_SALE_WITH_QR = {
      ...MOCK_SALE,
      fiscalQrUrl: 'https://ofd.soliq.uz/check?t=123&s=456&r=789',
      fiscalSign: '456',
      fiscalReceiptSeq: 789,
      fiscalTerminalId: '123',
    };

    it('renders QR code svg for standard SALE receipt', () => {
      const html = renderToStaticMarkup(
        React.createElement(FiscalReceiptBody, {
          sale: { ...FISCAL_SALE_WITH_QR, receiptType: 'SALE' },
        })
      );
      expect(html).toContain('<svg');
    });

    it('renders QR code svg for RETURN receipt', () => {
      const html = renderToStaticMarkup(
        React.createElement(FiscalReceiptBody, {
          sale: { ...FISCAL_SALE_WITH_QR, receiptType: 'RETURN' },
        })
      );
      expect(html).toContain('<svg');
    });

    it('does NOT render QR code svg for ADVANCE receipt', () => {
      const html = renderToStaticMarkup(
        React.createElement(FiscalReceiptBody, {
          sale: { ...FISCAL_SALE_WITH_QR, receiptType: 'ADVANCE' },
        })
      );
      expect(html).not.toContain('<svg');
    });

    it('does NOT render QR code svg for CREDIT receipt', () => {
      const html = renderToStaticMarkup(
        React.createElement(FiscalReceiptBody, {
          sale: { ...FISCAL_SALE_WITH_QR, receiptType: 'CREDIT' },
        })
      );
      expect(html).not.toContain('<svg');
    });
  });

  describe('FiscalReceiptBody: Software version row on receipt (AUR-6)', () => {
    it('renders 1 row ("Versiya: 1.0.0 (YYYY-MM-DD)") in browser mode and omits "Desktop versiyasi"', async () => {
      await i18n.changeLanguage('ru');
      const html = renderToStaticMarkup(
        React.createElement(FiscalReceiptBody, {
          sale: {
            ...MOCK_SALE,
            fiscalTerminalId: 'FM998877',
            fiscalReceiptSeq: '101',
            fiscalSign: '998877665544',
          },
        })
      );

      expect(html).toContain('>Versiya<');
      expect(html).toMatch(/1\.0\.0 \(\d{4}-\d{2}-\d{2}\)/);
      expect(html).not.toContain('Desktop versiyasi');
      expect(html).toContain('FM raqami');
      expect(html).toContain('FM998877');
      expect(html).not.toContain('Версия');
    });

    it('renders 2 rows ("Versiya: 1.0.0 (YYYY-MM-DD)" + "Desktop versiyasi: 1.3.4") in Electron mode under FM number', () => {
      const prevWindow = globalThis.window;
      globalThis.window = {
        desktopCashier: {
          isDesktop: true,
          appVersion: '1.3.4',
        },
      };
      try {
        const html = renderToStaticMarkup(
          React.createElement(FiscalReceiptBody, {
            sale: {
              ...MOCK_SALE,
              fiscalTerminalId: 'FM998877',
              fiscalReceiptSeq: '101',
              fiscalSign: '998877665544',
            },
          })
        );

        expect(html).toContain('>Versiya<');
        expect(html).toMatch(/1\.0\.0 \(\d{4}-\d{2}-\d{2}\)/);
        expect(html).toContain('Desktop versiyasi');
        expect(html).toContain('1.3.4');
        expect(html).toContain('receipt-row--nowrap');
      } finally {
        globalThis.window = prevWindow;
      }
    });

    it('renders version without date when git info is absent (CI/archive)', () => {
      globalThis.__APP_VERSION__ = '1.0.0';
      globalThis.__APP_COMMIT_DATE__ = '';
      globalThis.__APP_GIT_HASH__ = '';
      try {
        const html = renderToStaticMarkup(
          React.createElement(FiscalReceiptBody, {
            sale: {
              ...MOCK_SALE,
              fiscalTerminalId: 'FM998877',
              fiscalReceiptSeq: '101',
              fiscalSign: '998877665544',
            },
          })
        );

        expect(html).toContain('>Versiya<');
        expect(html).toContain('>1.0.0<');
        expect(html).not.toContain('Desktop versiyasi');
      } finally {
        delete globalThis.__APP_VERSION__;
        delete globalThis.__APP_COMMIT_DATE__;
        delete globalThis.__APP_GIT_HASH__;
      }
    });

    it('renders long version ("1.100.200-rc.12 (2026-11-18)") in full without truncation', () => {
      const html = renderToStaticMarkup(
        React.createElement(FiscalReceiptBody, {
          sale: {
            ...MOCK_SALE,
            appVersion: '1.100.200-rc.12 (2026-11-18)',
            desktopVersion: '1.10.12',
            fiscalTerminalId: 'FM998877',
            fiscalReceiptSeq: '101',
            fiscalSign: '998877665544',
          },
        })
      );

      expect(html).toContain('>Versiya<');
      expect(html).toContain('1.100.200-rc.12 (2026-11-18)');
      expect(html).toContain('Desktop versiyasi');
      expect(html).toContain('>1.10.12<');
    });

    it('renders "Litsenziya raqami: 1.3" in fiscalBlock when present and hides the row when empty', async () => {
      await i18n.changeLanguage('ru');
      globalThis.__APP_LICENSE_NUMBER__ = '1.3';
      try {
        const htmlWithLicense = renderToStaticMarkup(
          React.createElement(FiscalReceiptBody, {
            sale: {
              ...MOCK_SALE,
              fiscalTerminalId: 'FM998877',
              fiscalReceiptSeq: '101',
              fiscalSign: '998877665544',
            },
          })
        );
        expect(htmlWithLicense).toContain('Litsenziya raqami');
        expect(htmlWithLicense).toContain('>1.3<');
        expect(htmlWithLicense).not.toContain('Номер лицензии');

        globalThis.__APP_LICENSE_NUMBER__ = '';
        const htmlWithoutLicense = renderToStaticMarkup(
          React.createElement(FiscalReceiptBody, {
            sale: {
              ...MOCK_SALE,
              fiscalTerminalId: 'FM998877',
              fiscalReceiptSeq: '101',
              fiscalSign: '998877665544',
            },
          })
        );
        expect(htmlWithoutLicense).not.toContain('Litsenziya raqami');
      } finally {
        delete globalThis.__APP_LICENSE_NUMBER__;
      }
    });
  });
});

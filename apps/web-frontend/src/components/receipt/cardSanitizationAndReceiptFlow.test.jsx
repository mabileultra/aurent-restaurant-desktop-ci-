import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  sanitizeCardPaymentFields,
  buildMultikassaCardFields,
  buildFiscalDriveCardFields,
} from '@aurent/shared-fiscal';
import FiscalReceiptBody from './FiscalReceiptBody';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { buildReceiptOnPrinter } from '../../../../desktop-electron/electron/cashier-receipt-escpos/escpos-sale-builder.cjs';
import { createFakeThermalPrinter } from '../../../../desktop-electron/test/support/fakeThermalPrinter.cjs';

function getPrintedLines(printer) {
  return printer.calls
    .filter((c) => c.method === 'println' || c.method === 'leftRight')
    .map((c) => c.args.join(' '))
    .join('\n');
}

describe('Card Sanitization & Receipt Flow (MIXED + 0, CREDIT, ADVANCE, CARD)', () => {
  const BASE_RESIDUAL_CARD_INFO = {
    cardType: 'HUMO',
    cardCategory: 'SOCIAL',
    rrn: '631810177451',
    socialCardNumber: '986003******8031:01',
    pptId: '631810177451',
  };

  const BASE_ITEM = {
    id: 'item-1',
    productName: 'Non',
    quantity: 1,
    unitOfMeasure: 'dona',
    price: 50000,
    unitPrice: 50000,
    lineTotal: 50000,
    taxRatePercent: 12,
    taxAmount: 5357.14,
    ikpu: '00101001001000000',
  };

  it('1. MIXED + 0 cardAmount: sanitizes card fields, produces empty fiscal card payload, omits card rows on HTML and ESC/POS receipts', async () => {
    const rawPayment = {
      paymentMethod: 'MIXED',
      receiptType: 'SALE',
      cashAmount: 50000,
      cardAmount: 0,
      totalAmount: 50000,
      ...BASE_RESIDUAL_CARD_INFO,
    };

    // 1a: sanitizeCardPaymentFields
    const sanitized = sanitizeCardPaymentFields(rawPayment);
    expect(sanitized.cardAmount).toBe(0);
    expect(sanitized.cardType).toBeNull();
    expect(sanitized.cardCategory).toBeNull();
    expect(sanitized.rrn).toBeNull();
    expect(sanitized.socialCardNumber).toBeNull();
    expect(sanitized.pptId).toBeUndefined();

    // 1b: Fiscal payloads (receivedCard = 0)
    expect(buildMultikassaCardFields(sanitized, 0)).toEqual({});
    expect(buildFiscalDriveCardFields(sanitized, 0)).toEqual({});
    // Even if unsanitized payment was mistakenly passed with receivedCard = 0:
    expect(buildMultikassaCardFields(rawPayment, 0)).toEqual({});
    expect(buildFiscalDriveCardFields(rawPayment, 0)).toEqual({});

    // 1c: Server payload simulation
    const serverPayload = {
      storeId: 1,
      paymentMethod: sanitized.paymentMethod,
      cashAmount: sanitized.cashAmount,
      cardAmount: sanitized.cardAmount,
      ...(sanitized.cardType ? { cardType: sanitized.cardType } : {}),
    };
    expect(serverPayload.cardType).toBeUndefined();
    expect(serverPayload.cardAmount).toBe(0);

    // 1d: HTML receipt check
    useTenantDisplayStore.setState({
      flags: { payment: true, receiptType: true },
      committed: { receiptCompanyName: 'Test Market' },
    });
    const sale = {
      id: 'sale-mixed-0',
      receiptNumber: 'CHK-1',
      totalAmount: 50000,
      receiptType: 'SALE',
      paymentMethod: sanitized.paymentMethod,
      cashAmount: sanitized.cashAmount,
      cardAmount: sanitized.cardAmount,
      cardType: sanitized.cardType,
      cardCategory: sanitized.cardCategory,
      rrn: sanitized.rrn,
      socialCardNumber: sanitized.socialCardNumber,
      items: [BASE_ITEM],
    };
    const html = renderToStaticMarkup(<FiscalReceiptBody sale={sale} />);
    expect(html).toContain('Naqd');
    expect(html).not.toContain('Bank kartasi turi');
    expect(html).not.toContain('Ijtimoiy karta');
    expect(html).not.not.toContain('9860');
    expect(html).not.toContain('RRN kodi');

    // 1e: ESC/POS receipt check (80mm)
    const printer = createFakeThermalPrinter();
    printer.getWidth = () => 48;
    await buildReceiptOnPrinter(
      printer,
      {
        paperWmm: 80,
        locale: 'uz',
        receiptFields: { payment: true, items: true },
        labels: {
          paymentForm: 'To‘lov shakli:',
          cash: 'Naqd',
          plastic: 'Bank kartasi',
          cardType: 'Bank kartasi turi',
          socialCardNumber: 'Ijtimoiy karta',
          cardRrn: 'RRN kodi',
        },
        sale,
      },
      'job-mixed-0'
    );
    const escposOutput = getPrintedLines(printer);
    expect(escposOutput).toContain('Naqd');
    expect(escposOutput).not.toContain('HUMO');
    expect(escposOutput).not.toContain('9860');
    expect(escposOutput).not.toContain('631810177451');
  });

  it('2. CREDIT sale: sanitizes card fields, produces empty fiscal card payload, omits card rows on receipts', async () => {
    const rawPayment = {
      paymentMethod: 'CREDIT',
      receiptType: 'CREDIT',
      cardAmount: 50000,
      totalAmount: 50000,
      ...BASE_RESIDUAL_CARD_INFO,
    };

    // 2a: sanitizeCardPaymentFields
    const sanitized = sanitizeCardPaymentFields(rawPayment);
    expect(sanitized.cardAmount).toBe(0);
    expect(sanitized.cardType).toBeNull();
    expect(sanitized.cardCategory).toBeNull();
    expect(sanitized.rrn).toBeNull();
    expect(sanitized.socialCardNumber).toBeNull();

    // 2b: Fiscal payloads
    expect(buildMultikassaCardFields(sanitized, 0)).toEqual({});
    expect(buildFiscalDriveCardFields(sanitized, 0)).toEqual({});

    // 2c: HTML receipt check
    const sale = {
      id: 'sale-credit',
      receiptNumber: 'CHK-2',
      totalAmount: 50000,
      receiptType: 'CREDIT',
      paymentMethod: 'CREDIT',
      cardAmount: sanitized.cardAmount,
      cardType: sanitized.cardType,
      rrn: sanitized.rrn,
      items: [BASE_ITEM],
    };
    const html = renderToStaticMarkup(<FiscalReceiptBody sale={sale} />);
    expect(html).toContain('Kredit cheki');
    expect(html).not.toContain('Bank kartasi turi');
    expect(html).not.toContain('RRN kodi');
  });

  it('3. ADVANCE sale: sanitizes card fields, produces empty fiscal card payload, omits card rows on receipts', async () => {
    const rawPayment = {
      paymentMethod: 'ADVANCE',
      receiptType: 'ADVANCE',
      cardAmount: 50000,
      totalAmount: 50000,
      ...BASE_RESIDUAL_CARD_INFO,
    };

    // 3a: sanitizeCardPaymentFields
    const sanitized = sanitizeCardPaymentFields(rawPayment);
    expect(sanitized.cardAmount).toBe(0);
    expect(sanitized.cardType).toBeNull();
    expect(sanitized.cardCategory).toBeNull();
    expect(sanitized.rrn).toBeNull();
    expect(sanitized.socialCardNumber).toBeNull();

    // 3b: Fiscal payloads
    expect(buildMultikassaCardFields(sanitized, 0)).toEqual({});
    expect(buildFiscalDriveCardFields(sanitized, 0)).toEqual({});

    // 3c: HTML receipt check
    const sale = {
      id: 'sale-advance',
      receiptNumber: 'CHK-3',
      totalAmount: 50000,
      receiptType: 'ADVANCE',
      paymentMethod: 'ADVANCE',
      cardAmount: sanitized.cardAmount,
      cardType: sanitized.cardType,
      rrn: sanitized.rrn,
      items: [BASE_ITEM],
    };
    const html = renderToStaticMarkup(<FiscalReceiptBody sale={sale} />);
    expect(html).toContain('Avans cheki');
    expect(html).not.toContain('Bank kartasi turi');
    expect(html).not.toContain('RRN kodi');
  });

  it('4. CARD sale with cardAmount > 0: retains card details across fiscal payload, server payload, and receipts', async () => {
    const rawPayment = {
      paymentMethod: 'CARD',
      receiptType: 'SALE',
      cardAmount: 50000,
      totalAmount: 50000,
      ...BASE_RESIDUAL_CARD_INFO,
    };

    // 4a: sanitizeCardPaymentFields
    const sanitized = sanitizeCardPaymentFields(rawPayment);
    expect(sanitized.cardAmount).toBe(50000);
    expect(sanitized.cardType).toBe('HUMO');
    expect(sanitized.cardCategory).toBe('SOCIAL');
    expect(sanitized.rrn).toBe('631810177451');
    expect(sanitized.socialCardNumber).toBe('986003******8031:01');

    // 4b: Fiscal payloads (receivedCard = 50000)
    expect(buildMultikassaCardFields(sanitized, 50000)).toEqual({
      card_type: 3,
      ppt_id: '631810177451',
      card_number: '9860********8031',
    });
    expect(buildFiscalDriveCardFields(sanitized, 50000)).toEqual({
      CardType: 3,
      PPTID: '631810177451',
      CardNumber: '9860********8031',
    });

    // 4c: Server payload simulation
    const serverPayload = {
      storeId: 1,
      paymentMethod: sanitized.paymentMethod,
      cardAmount: sanitized.cardAmount,
      ...(sanitized.cardType ? { cardType: sanitized.cardType } : {}),
    };
    expect(serverPayload.cardType).toBe('HUMO');
    expect(serverPayload.cardAmount).toBe(50000);

    // 4d: HTML receipt check
    const sale = {
      id: 'sale-card-active',
      receiptNumber: 'CHK-4',
      totalAmount: 50000,
      receiptType: 'SALE',
      paymentMethod: 'CARD',
      cardAmount: sanitized.cardAmount,
      cardType: sanitized.cardType,
      cardCategory: sanitized.cardCategory,
      rrn: sanitized.rrn,
      socialCardNumber: sanitized.socialCardNumber,
      items: [BASE_ITEM],
    };
    const html = renderToStaticMarkup(<FiscalReceiptBody sale={sale} />);
    expect(html).toContain('Bank kartasi (Humo)');
    expect(html).toContain('Bank kartasi turi');
    expect(html).toContain('Ijtimoiy');
    expect(html).toContain('9860 **** **** 8031');
    expect(html).toContain('RRN kodi');
    expect(html).toContain('631810177451');

    // 4e: ESC/POS receipt check (80mm)
    const printer = createFakeThermalPrinter();
    printer.getWidth = () => 48;
    await buildReceiptOnPrinter(
      printer,
      {
        paperWmm: 80,
        locale: 'uz',
        receiptFields: { payment: true, items: true },
        labels: {
          paymentForm: 'To‘lov shakli:',
          plastic: 'Bank kartasi (Humo)',
          cardType: 'Bank kartasi turi',
          cardNumber: 'Karta raqami',
          socialCardNumber: 'Ijtimoiy karta',
          cardRrn: 'RRN kodi',
        },
        sale,
      },
      'job-card-active'
    );
    const escposOutput = getPrintedLines(printer);
    expect(escposOutput).toContain('Bank kartasi (Humo)');
    expect(escposOutput).toContain('Ijtimoiy');
    expect(escposOutput).toContain('9860 **** **** 8031');
    expect(escposOutput).toContain('631810177451');
  });
});

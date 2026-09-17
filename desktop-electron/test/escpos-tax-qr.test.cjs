/**
 * Налоговый QR (ofd.soliq.uz) должен попасть на чек.
 * Обычная ссылка и выключенный флаг печать QR не запускают.
 */
const assert = require('node:assert/strict');
const test = require('node:test');
const { appendQrAndFooter, buildReceiptOnPrinter } = require('../electron/cashier-receipt-escpos/escpos-sale-builder.cjs');
const { callsOf, createFakeThermalPrinter } = require('./support/fakeThermalPrinter.cjs');

const TAX_QR =
  'https://ofd.soliq.uz/check?t=TERM1&r=42&c=20260907122636&s=SIGN99';

function fiscalPayload(overrides = {}) {
  return {
    paperWmm: 80,
    locale: 'ru',
    qrValue: TAX_QR,
    receiptFields: { qrCode: true, fiscalBlock: true, items: true },
    labels: {
      fiscalReceiptNo: 'ФД',
      fmNumber: 'ФМ',
      fiscalSign: 'ФП',
    },
    sale: {
      id: 'sale-1',
      receiptNumber: 'RCP-20260907-0010',
      cashierName: 'Cashier',
      createdAt: '2026-09-07T05:26:36',
      totalAmount: 1000,
      taxTotal: 107.14,
      paymentMethod: 'CASH',
      amountTendered: 1000,
      changeGiven: 0,
      fiscalSign: 'SIGN99',
      fiscalReceiptSeq: '42',
      fiscalTerminalId: 'TERM1',
      fiscalizedAt: '2026-09-07T05:26:36',
      fiscalQrUrl: TAX_QR,
      printFiscalQr: true,
      items: [{ productName: 'Item', quantity: 1, lineTotal: 1000 }],
    },
    branding: { companyName: 'Test Co' },
    ...overrides,
  };
}

test('tax QR is printed from the ofd url', async () => {
  const printer = createFakeThermalPrinter();
  await appendQrAndFooter(printer, fiscalPayload(), 'job-1');

  const qr = callsOf(printer, 'printQR');
  assert.equal(qr.length, 1);
  assert.equal(qr[0].args[0], TAX_QR);
  assert.equal(qr[0].args[1].cellSize, 7);
});

test('tax QR image is preferred over generated printQR', async () => {
  const printer = createFakeThermalPrinter();
  const payload = fiscalPayload({
    qrImageDataUrl: 'data:image/png;base64,iVBORw0KGgo=',
  });

  await appendQrAndFooter(printer, payload, 'job-img');

  assert.equal(callsOf(printer, 'printImage').length, 1);
  assert.equal(callsOf(printer, 'printQR').length, 0);
});

test('non-tax link is not printed as a fiscal QR', async () => {
  const printer = createFakeThermalPrinter();
  const payload = fiscalPayload({ qrValue: 'https://aurent.uz/install' });
  payload.sale = { ...payload.sale, fiscalQrUrl: payload.qrValue };

  await appendQrAndFooter(printer, payload, 'job-2');

  assert.equal(callsOf(printer, 'printQR').length, 0);
  assert.equal(callsOf(printer, 'printImage').length, 0);
});

test('desktop toggle off skips tax QR', async () => {
  const printer = createFakeThermalPrinter();
  const payload = fiscalPayload();
  payload.sale = { ...payload.sale, printFiscalQr: false };

  await appendQrAndFooter(printer, payload, 'job-3');

  assert.equal(callsOf(printer, 'printQR').length, 0);
});

test('full receipt still prints fiscal rows and tax QR', async () => {
  const printer = createFakeThermalPrinter();
  await buildReceiptOnPrinter(printer, fiscalPayload(), 'job-full');

  const rows = callsOf(printer, 'leftRight').map((call) => call.args.join(' '));
  assert.ok(rows.some((row) => row.includes('42')));
  assert.ok(rows.some((row) => row.includes('TERM1')));
  assert.ok(rows.some((row) => row.includes('SIGN99')));
  assert.equal(callsOf(printer, 'printQR')[0].args[0], TAX_QR);
  assert.equal(callsOf(printer, 'cut').length, 1);
});

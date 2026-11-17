/**
 * Soliq QR (ofd.soliq.uz) chekka chiqishi tekshiruvi.
 * AUR-4: ADVANCE va CREDIT cheklarida QR chiqmasligi kerak.
 */
const assert = require('node:assert/strict');
const test = require('node:test');
const { appendQrAndFooter, buildReceiptOnPrinter } = require('../electron/cashier-receipt-escpos/escpos-sale-builder.cjs');

const TAX_QR = 'https://ofd.soliq.uz/check?t=TERM1&r=42&c=20260907122636&s=SIGN99';

function createFakePrinter() {
  const calls = [];
  const printer = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'calls') return calls;
        if (prop === 'getWidth') return () => 48;
        return (...args) => {
          calls.push({ method: String(prop), args });
        };
      },
    },
  );
  return printer;
}

function fiscalPayload(overrides = {}) {
  return {
    paperWmm: 80,
    locale: 'uz',
    qrValue: TAX_QR,
    receiptFields: { qrCode: true, fiscalBlock: true, items: true },
    sale: {
      id: 'sale-1',
      receiptNumber: 'RCP-20260907-0010',
      totalAmount: 1000,
      fiscalSign: 'SIGN99',
      fiscalReceiptSeq: '42',
      fiscalTerminalId: 'TERM1',
      fiscalQrUrl: TAX_QR,
      printFiscalQr: true,
      receiptType: 'SALE',
    },
    ...overrides,
  };
}

test('restaurant-desktop: tax QR is printed for standard SALE', async () => {
  const printer = createFakePrinter();
  await appendQrAndFooter(printer, fiscalPayload(), 'job-1');

  const qrCalls = printer.calls.filter((c) => c.method === 'printQR');
  assert.equal(qrCalls.length, 1);
  assert.equal(qrCalls[0].args[0], TAX_QR);
});

test('restaurant-desktop: tax QR is printed for RETURN receipt', async () => {
  const printer = createFakePrinter();
  const payload = fiscalPayload();
  payload.sale = { ...payload.sale, receiptType: 'RETURN' };
  await appendQrAndFooter(printer, payload, 'job-ret');

  const qrCalls = printer.calls.filter((c) => c.method === 'printQR');
  assert.equal(qrCalls.length, 1);
  assert.equal(qrCalls[0].args[0], TAX_QR);
});

test('restaurant-desktop: advance receipt skips tax QR (AUR-4)', async () => {
  const printer = createFakePrinter();
  const payload = fiscalPayload();
  payload.sale = { ...payload.sale, receiptType: 'ADVANCE' };
  await appendQrAndFooter(printer, payload, 'job-adv');

  const qrCalls = printer.calls.filter((c) => c.method === 'printQR');
  assert.equal(qrCalls.length, 0);
});

test('restaurant-desktop: credit receipt skips tax QR (AUR-4)', async () => {
  const printer = createFakePrinter();
  const payload = fiscalPayload();
  payload.sale = { ...payload.sale, receiptType: 'CREDIT' };
  await appendQrAndFooter(printer, payload, 'job-crd');

  const qrCalls = printer.calls.filter((c) => c.method === 'printQR');
  assert.equal(qrCalls.length, 0);
});

test('restaurant-desktop: full receipt prints software version row (AUR-6) next to FM number', async () => {
  const printer = createFakePrinter();
  const payload = fiscalPayload({
    labels: {
      fmNumber: 'FM',
      appVersion: 'Dastur versiyasi',
    },
    sale: {
      ...fiscalPayload().sale,
      appVersion: '1.2.0',
    },
  });
  await buildReceiptOnPrinter(printer, payload, 'job-ver');

  const rows = printer.calls
    .filter((c) => c.method === 'leftRight')
    .map((c) => c.args.join(' '));
  assert.ok(rows.some((row) => row.includes('Dastur versiyasi') && row.includes('1.2.0')));
  assert.ok(rows.some((row) => row.includes('FM') && row.includes('TERM1')));
});


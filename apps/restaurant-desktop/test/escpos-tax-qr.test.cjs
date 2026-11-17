/**
 * Soliq QR (ofd.soliq.uz) chekka chiqishi tekshiruvi.
 * AUR-4: ADVANCE va CREDIT cheklarida QR chiqmasligi kerak.
 */
const assert = require('node:assert/strict');
const test = require('node:test');
const { appendQrAndFooter } = require('../electron/cashier-receipt-escpos/escpos-sale-builder.cjs');

const TAX_QR = 'https://ofd.soliq.uz/check?t=TERM1&r=42&c=20260907122636&s=SIGN99';

function createFakePrinter() {
  const calls = [];
  return {
    calls,
    getWidth() { return 48; },
    alignLeft() { calls.push({ method: 'alignLeft', args: [] }); },
    alignCenter() { calls.push({ method: 'alignCenter', args: [] }); },
    alignRight() { calls.push({ method: 'alignRight', args: [] }); },
    leftRight(left, right) { calls.push({ method: 'leftRight', args: [left, right] }); },
    println(text) { calls.push({ method: 'println', args: [text] }); },
    print(text) { calls.push({ method: 'print', args: [text] }); },
    printQR(str, opts) { calls.push({ method: 'printQR', args: [str, opts] }); },
    printImage(path) { calls.push({ method: 'printImage', args: [path] }); },
    newLine() { calls.push({ method: 'newLine', args: [] }); },
    bold(on) { calls.push({ method: 'bold', args: [on] }); },
  };
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

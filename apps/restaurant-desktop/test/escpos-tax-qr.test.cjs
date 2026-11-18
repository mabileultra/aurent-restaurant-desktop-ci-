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

test('restaurant-desktop: full receipt prints software version rows (AUR-6: 1 row in browser, 2 rows in Electron, fits 58mm/32 cols)', async () => {
  const printerBrowser = createFakePrinter();
  const payloadBrowser = fiscalPayload({
    paperWmm: 58,
    labels: {
      fmNumber: 'FM',
      appVersion: 'Dastur versiyasi',
      desktopVersion: 'Desktop versiyasi',
    },
    sale: {
      ...fiscalPayload().sale,
      appVersion: '1.0.0 (a1b2c3d)',
      desktopVersion: '',
    },
  });
  await buildReceiptOnPrinter(printerBrowser, payloadBrowser, 'job-ver-browser');

  const browserRows = printerBrowser.calls
    .filter((c) => c.method === 'leftRight')
    .map((c) => c.args.join(' '));
  assert.ok(browserRows.some((row) => row === 'Dastur versiyasi 1.0.0 (a1b2c3d)'));
  assert.ok(!browserRows.some((row) => row.includes('Desktop versiyasi')));

  const printerDesktop = createFakePrinter();
  const payloadDesktop = fiscalPayload({
    paperWmm: 58,
    labels: {
      fmNumber: 'FM',
      appVersion: 'Dastur versiyasi',
      desktopVersion: 'Desktop versiyasi',
    },
    sale: {
      ...fiscalPayload().sale,
      appVersion: '1.0.0 (a1b2c3d)',
      desktopVersion: '0.1.37',
    },
  });
  await buildReceiptOnPrinter(printerDesktop, payloadDesktop, 'job-ver-desktop');

  const desktopLeftRight = printerDesktop.calls.filter((c) => c.method === 'leftRight');
  const desktopRows = desktopLeftRight.map((c) => c.args.join(' '));
  assert.ok(desktopRows.some((row) => row === 'Dastur versiyasi 1.0.0 (a1b2c3d)'));
  assert.ok(desktopRows.some((row) => row === 'Desktop versiyasi 0.1.37'));

  for (const call of desktopLeftRight) {
    const [left, right] = call.args;
    if (left === 'Dastur versiyasi' || left === 'Desktop versiyasi') {
      assert.ok(
        left.length + 1 + right.length <= 32,
        `58mm overflow: "${left} ${right}" is ${left.length + 1 + right.length} chars (>32)`,
      );
    }
  }

  // Long version (> 32 chars with label on 58mm): label on line 1, full uncut value on line 2
  const printerLong58 = createFakePrinter();
  const payloadLong58 = fiscalPayload({
    paperWmm: 58,
    labels: {
      fmNumber: 'FM',
      appVersion: 'Dastur versiyasi',
      desktopVersion: 'Desktop versiyasi',
    },
    sale: {
      ...fiscalPayload().sale,
      appVersion: '1.10.12 (a1b2c3d)',
      desktopVersion: '1.10.12',
    },
  });
  await buildReceiptOnPrinter(printerLong58, payloadLong58, 'job-ver-long58');

  const printlnArgs = printerLong58.calls
    .filter((c) => c.method === 'println')
    .map((c) => c.args[0]);
  const lrCalls = printerLong58.calls
    .filter((c) => c.method === 'leftRight')
    .map((c) => c.args);
  assert.ok(printlnArgs.includes('Dastur versiyasi'));
  assert.ok(lrCalls.some(([left, right]) => left === '' && right === '1.10.12 (a1b2c3d)'));
  assert.ok(lrCalls.some(([left, right]) => left === 'Desktop versiyasi' && right === '1.10.12'));
});


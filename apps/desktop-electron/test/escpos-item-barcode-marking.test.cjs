/**
 * Band 13 & 14: ShT.kod va MK (markirovka kodi) tovar ostida chop etilishi.
 */
const assert = require('node:assert/strict');
const test = require('node:test');
const { appendItems } = require('../electron/cashier-receipt-escpos/escpos-sale-body.cjs');
const {
  resolveItemBarcode,
  resolveItemMarkingLabel,
  toOfdMarkingLabel,
} = require('../electron/cashier-receipt-escpos/escpos-format.cjs');
const { createFakeThermalPrinter } = require('./support/fakeThermalPrinter.cjs');

function printedText(printer) {
  return printer.calls
    .filter((c) => c.method === 'leftRight' || c.method === 'println')
    .map((c) => c.args.join(' '))
    .join('\n');
}

const FULL_KM =
  '0108906002059409218MTGE3S706TDT91UZF092enFQOcSQ9jQzKA16EsBIzjMGF9RCYf1JZd2ReSG6eiU=';
const OFD_LABEL = '0108906002059409218MTGE3S706TDT';

test('resolveItemBarcode and resolveItemMarkingLabel work correctly in CommonJS', () => {
  assert.equal(resolveItemBarcode({ barcode: '4780012345678' }), '4780012345678');
  assert.equal(resolveItemBarcode({ sku: 'SKU-001' }), 'SKU-001');
  assert.equal(resolveItemBarcode({}), '');

  assert.equal(resolveItemMarkingLabel({ markingCode: FULL_KM }), OFD_LABEL);
  assert.equal(resolveItemMarkingLabel({ productMark: FULL_KM }), OFD_LABEL);
  assert.equal(resolveItemMarkingLabel({ productMarks: [FULL_KM] }), OFD_LABEL);
  assert.equal(resolveItemMarkingLabel({ km: FULL_KM }), OFD_LABEL);
  assert.equal(resolveItemMarkingLabel({}), '');
});

test('appendItems prints ShT.kod and MK rows under item row on 58mm printer without truncation', () => {
  const printer = createFakeThermalPrinter();
  printer.getWidth = () => 32;

  appendItems(printer, {
    paperWmm: 58,
    receiptFields: { items: true, itemIkpu: true },
    labels: {
      barcode: 'ShT.kod',
      marking: 'MK',
      ikpuLine: 'MXIK',
    },
    sale: {
      items: [
        {
          productName: 'Suv 0.5L',
          quantity: 2,
          unitPrice: 5000,
          lineTotal: 10000,
          ikpu: '00101001001000000',
          barcode: '4780012345678',
          markingCode: FULL_KM,
        },
      ],
    },
  });

  const text = printedText(printer);
  assert.equal(text.includes('MXIK: 00101001001000000'), true);
  assert.equal(text.includes('ShT.kod: 4780012345678'), true);
  // On 58mm printer (32 cols), MK is 32 chars and wraps onto line(s) cleanly without being cut
  assert.equal(text.includes('MK:'), true);
  assert.equal(text.includes('0108906002059409218MTGE3S706TDT'), true);
});

test('appendItems omits ShT.kod and MK when not present', () => {
  const printer = createFakeThermalPrinter();
  printer.getWidth = () => 48;

  appendItems(printer, {
    paperWmm: 80,
    receiptFields: { items: true, itemIkpu: true },
    labels: {
      barcode: 'ShT.kod',
      marking: 'MK',
      ikpuLine: 'MXIK',
    },
    sale: {
      items: [
        {
          productName: 'Non',
          quantity: 1,
          unitPrice: 3000,
          lineTotal: 3000,
          ikpu: '00101001001000000',
        },
      ],
    },
  });

  const text = printedText(printer);
  assert.equal(text.includes('ShT.kod'), false);
  assert.equal(text.includes('MK:'), false);
});

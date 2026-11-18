/**
 * Band 13 & 14: ShT.kod va MK (markirovka kodi) tovar ostida chop etilishi (Pharmacy Desktop).
 */
const assert = require('node:assert/strict');
const test = require('node:test');
const { appendItems } = require('../electron/cashier-receipt-escpos/escpos-sale-body.cjs');
const {
  resolveItemBarcode,
  resolveItemMarkingLabel,
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
          productName: 'Paratsetamol 500mg',
          quantity: 1,
          unitPrice: 8000,
          lineTotal: 8000,
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
  assert.equal(text.includes('MK:'), true);
  assert.equal(text.includes('0108906002059409218MTGE3S706TDT'), true);
});

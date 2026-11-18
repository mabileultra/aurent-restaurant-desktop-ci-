/**
 * Band 13 & 14: ShT.kod va MK (markirovka kodi) tovar ostida chop etilishi (Restaurant Desktop).
 */
const assert = require('node:assert/strict');
const test = require('node:test');
const { appendItems } = require('../electron/cashier-receipt-escpos/escpos-sale-builder.cjs');

function createFakePrinter() {
  const calls = [];
  return {
    calls,
    getWidth() { return 32; },
    alignLeft() { calls.push({ method: 'alignLeft', args: [] }); },
    alignRight() { calls.push({ method: 'alignRight', args: [] }); },
    leftRight(left, right) { calls.push({ method: 'leftRight', args: [left, right] }); },
    println(text) { calls.push({ method: 'println', args: [text] }); },
    bold(on) { calls.push({ method: 'bold', args: [on] }); },
    drawLine() { calls.push({ method: 'drawLine', args: [] }); },
  };
}

function printedText(printer) {
  return printer.calls
    .filter((c) => c.method === 'leftRight' || c.method === 'println')
    .map((c) => c.args.join(' '))
    .join('\n');
}

const FULL_KM =
  '0108906002059409218MTGE3S706TDT91UZF092enFQOcSQ9jQzKA16EsBIzjMGF9RCYf1JZd2ReSG6eiU=';

test('restaurant appendItems prints ShT.kod and MK rows under item row on 58mm printer without truncation', () => {
  const printer = createFakePrinter();

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
          productName: 'Sharbat 1L',
          quantity: 1,
          unitPrice: 15000,
          lineTotal: 15000,
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

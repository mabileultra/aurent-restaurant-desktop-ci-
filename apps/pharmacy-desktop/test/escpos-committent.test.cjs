/**
 * AUR-7: Коммитент STIR / JShShIR под позицией чека в ESC/POS (Pharmacy Desktop).
 */
const assert = require('node:assert/strict');
const test = require('node:test');
const { appendItems } = require('../electron/cashier-receipt-escpos/escpos-sale-body.cjs');
const {
  parseCommittentIdentifier,
  resolveItemCommittent,
} = require('../electron/cashier-receipt-escpos/escpos-format.cjs');
const { createFakeThermalPrinter } = require('./support/fakeThermalPrinter.cjs');

function printedText(printer) {
  return printer.calls
    .filter((c) => c.method === 'leftRight' || c.method === 'println')
    .map((c) => c.args.join(' '))
    .join('\n');
}

test('parseCommittentIdentifier validates 9-digit TIN and 14-digit PINFL', () => {
  assert.deepEqual(parseCommittentIdentifier('200523221'), { kind: 'TIN', value: '200523221' });
  assert.deepEqual(parseCommittentIdentifier('12345678901234'), {
    kind: 'PINFL',
    value: '12345678901234',
  });
  assert.equal(parseCommittentIdentifier('000000000'), null);
  assert.equal(parseCommittentIdentifier('12345678'), null);
  assert.equal(parseCommittentIdentifier('1234567890'), null);
  assert.equal(parseCommittentIdentifier('20052322A'), null);
  assert.equal(parseCommittentIdentifier(''), null);
  assert.equal(parseCommittentIdentifier(null), null);
});

test('appendItems prints committent TIN under item row on 58mm printer', () => {
  const printer = createFakeThermalPrinter();

  appendItems(printer, {
    paperWmm: 58,
    receiptFields: { items: true, itemIkpu: true },
    labels: {
      committentTin: 'Komitent (STIR)',
      committentPinfl: 'Komitent (JShShIR)',
      ikpuLine: 'MXIK',
    },
    sale: {
      items: [
        {
          productName: 'Paratsetamol 500mg',
          quantity: 1,
          unitPrice: 5000,
          lineTotal: 5000,
          ikpu: '00101001001000000',
          commissionTin: '200523221',
        },
      ],
    },
  });

  const text = printedText(printer);
  assert.equal(text.includes('Paratsetamol 500mg'), true);
  assert.equal(text.includes('MXIK: 00101001001000000'), true);
  assert.equal(text.includes('Komitent (STIR): 200523221'), true);
});

test('appendItems safely wraps 14-digit committent PINFL on narrow 58mm printer so nothing is truncated', () => {
  const printer = createFakeThermalPrinter();

  appendItems(printer, {
    paperWmm: 58,
    receiptFields: { items: true },
    labels: {
      committentTin: 'Komitent (STIR)',
      committentPinfl: 'Komitent (JShShIR)',
    },
    sale: {
      items: [
        {
          productName: 'Shaxsiy dori vositasi',
          quantity: 1,
          unitPrice: 12000,
          lineTotal: 12000,
          commissionPinfl: '12345678901234',
        },
      ],
    },
  });

  const text = printedText(printer);
  assert.equal(text.includes('Komitent (JShShIR):'), true);
  assert.equal(text.includes('12345678901234'), true);
});

test('appendItems prints committent in single line on 80mm printer', () => {
  const printer = createFakeThermalPrinter();

  appendItems(printer, {
    paperWmm: 80,
    receiptFields: { items: true },
    labels: {
      committentTin: 'Komitent (STIR)',
      committentPinfl: 'Komitent (JShShIR)',
    },
    sale: {
      items: [
        {
          productName: 'Dori 80mm',
          quantity: 1,
          unitPrice: 20000,
          lineTotal: 20000,
          commissionPinfl: '12345678901234',
        },
      ],
    },
  });

  const text = printedText(printer);
  assert.equal(text.includes('Komitent (JShShIR): 12345678901234'), true);
});

test('appendItems omits committent row when missing or invalid', () => {
  const printer = createFakeThermalPrinter();
  appendItems(printer, {
    receiptFields: { items: true },
    labels: {
      committentTin: 'Komitent (STIR)',
    },
    sale: {
      items: [
        {
          productName: 'Oddiy dori',
          quantity: 1,
          unitPrice: 5000,
          lineTotal: 5000,
          commissionTin: 'invalid_tin',
        },
      ],
    },
  });

  const text = printedText(printer);
  assert.equal(text.includes('Komitent'), false);
});

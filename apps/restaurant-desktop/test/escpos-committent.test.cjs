/**
 * AUR-7: Коммитент STIR / JShShIR под позицией чека в ESC/POS (Restaurant Desktop).
 */
const assert = require('node:assert/strict');
const test = require('node:test');
const { appendItems } = require('../electron/cashier-receipt-escpos/escpos-sale-builder.cjs');
const {
  parseCommittentIdentifier,
  resolveItemCommittent,
} = require('../electron/cashier-receipt-escpos/escpos-format.cjs');
function createFakePrinter() {
  const calls = [];
  return {
    calls,
    getWidth() { return 48; },
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
  const printer = createFakePrinter();

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
          productName: 'Restoran ichimligi (komitent)',
          quantity: 1,
          unitPrice: 15000,
          lineTotal: 15000,
          ikpu: '00101001001000000',
          commissionTin: '200523221',
        },
      ],
    },
  });

  const text = printedText(printer);
  assert.equal(text.includes('Restoran ichimligi (komitent)'), true);
  assert.equal(text.includes('MXIK: 00101001001000000'), true);
  assert.equal(text.includes('Komitent (STIR): 200523221'), true);
});

test('appendItems safely wraps 14-digit committent PINFL on narrow 58mm printer so nothing is truncated', () => {
  const printer = createFakePrinter();

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
          productName: 'Uy sharoitida tayyorlangan desert',
          quantity: 1,
          unitPrice: 25000,
          lineTotal: 25000,
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
  const printer = createFakePrinter();

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
          productName: 'Taom 80mm',
          quantity: 1,
          unitPrice: 40000,
          lineTotal: 40000,
          commissionPinfl: '12345678901234',
        },
      ],
    },
  });

  const text = printedText(printer);
  assert.equal(text.includes('Komitent (JShShIR): 12345678901234'), true);
});

test('appendItems omits committent row when missing or invalid', () => {
  const printer = createFakePrinter();
  appendItems(printer, {
    receiptFields: { items: true },
    labels: {
      committentTin: 'Komitent (STIR)',
    },
    sale: {
      items: [
        {
          productName: 'Osh (komitentsiz)',
          quantity: 1,
          unitPrice: 35000,
          lineTotal: 35000,
          commissionTin: null,
        },
      ],
    },
  });

  const text = printedText(printer);
  assert.equal(text.includes('Komitent'), false);
});

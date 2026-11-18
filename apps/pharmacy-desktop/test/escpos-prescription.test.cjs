/**
 * Номер электронного рецепта печатается отдельной строкой чека ESC/POS.
 */
const assert = require('node:assert/strict');
const test = require('node:test');
const { appendPrescription } = require('../electron/cashier-receipt-escpos/escpos-sale-body.cjs');
const { createFakeThermalPrinter } = require('./support/fakeThermalPrinter.cjs');

function printedText(printer) {
  return printer.calls
    .filter((c) => c.method === 'leftRight' || c.method === 'println')
    .map((c) => c.args.join(' '))
    .join('\n');
}

test('appendPrescription prints a separate row with the prescription number', () => {
  const printer = createFakeThermalPrinter();
  appendPrescription(printer, {
    labels: { prescriptionNumber: 'Elektron retsept' },
    sale: { prescriptionNumber: 'RX-2026-0042' },
  });

  const text = printedText(printer);
  assert.equal(text.includes('Elektron retsept'), true);
  assert.equal(text.includes('RX-2026-0042'), true);
});

test('appendPrescription prints nothing for a sale without a prescription number', () => {
  const printer = createFakeThermalPrinter();
  appendPrescription(printer, {
    labels: { prescriptionNumber: 'Elektron retsept' },
    sale: { totalAmount: 5000, paymentMethod: 'CASH' },
  });

  assert.equal(printer.calls.length, 0);
});

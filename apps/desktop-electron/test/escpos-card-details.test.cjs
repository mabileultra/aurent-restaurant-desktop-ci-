/**
 * Блок оплаты ESC/POS печатает отдельные строки для типа карты, номера соц. карты и RRN.
 */
const assert = require('node:assert/strict');
const test = require('node:test');
const { appendPayment } = require('../electron/cashier-receipt-escpos/escpos-sale-body.cjs');
const { createFakeThermalPrinter } = require('./support/fakeThermalPrinter.cjs');

function printedText(printer) {
  return printer.calls
    .filter((c) => c.method === 'leftRight' || c.method === 'println')
    .map((c) => c.args.join(' '))
    .join('\n');
}

test('appendPayment prints card category, masked social card, and RRN rows when present', () => {
  const printer = createFakeThermalPrinter();
  appendPayment(printer, {
    receiptFields: { payment: true },
    labels: {
      paymentForm: 'Форма оплаты',
      cash: 'Наличные',
      plastic: 'Пластик · Humo',
      cardType: 'Тип карты',
      socialCardNumber: 'Социальная карта',
      cardRrn: 'RRN',
    },
    sale: {
      totalAmount: 15000,
      paymentMethod: 'CARD',
      cardAmount: 15000,
      cardCategoryDisplay: 'Социальная',
      socialCardNumber: '9860********8031',
      rrn: '631810177451',
    },
  });

  const text = printedText(printer);
  assert.equal(text.includes('Тип карты') && text.includes('Социальная'), true);
  assert.equal(text.includes('Социальная карта') && text.includes('9860 **** **** 8031'), true);
  assert.equal(text.includes('RRN') && text.includes('631810177451'), true);
});

test('appendPayment omits card detail rows for plain cash sale', () => {
  const printer = createFakeThermalPrinter();
  appendPayment(printer, {
    receiptFields: { payment: true },
    labels: {
      paymentForm: 'Форма оплаты',
      cash: 'Наличные',
      plastic: 'Пластик',
      cardType: 'Тип карты',
      socialCardNumber: 'Социальная карта',
      cardRrn: 'RRN',
    },
    sale: {
      totalAmount: 5000,
      paymentMethod: 'CASH',
      amountTendered: 5000,
    },
  });

  const text = printedText(printer);
  assert.equal(text.includes('Тип карты'), false);
  assert.equal(text.includes('Социальная карта'), false);
  assert.equal(text.includes('RRN'), false);
});

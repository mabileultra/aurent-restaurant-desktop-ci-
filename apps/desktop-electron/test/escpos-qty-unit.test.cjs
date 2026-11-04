const assert = require('node:assert/strict');
const test = require('node:test');
const { fmtQty } = require('../electron/cashier-receipt-escpos/escpos-format.cjs');

test('weight receipt uses the product unit', () => {
  assert.equal(fmtQty(200, 'WEIGHT', 'g'), '200 г');
  assert.equal(fmtQty(1.5, 'WEIGHT', 'kg'), '1.5 кг');
  assert.equal(fmtQty(0.5, 'WEIGHT'), '0.5 кг');
  assert.equal(fmtQty(2, 'PIECE'), '2');
});

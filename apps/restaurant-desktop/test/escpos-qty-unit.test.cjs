const assert = require('node:assert/strict');
const test = require('node:test');
const { fmtQty } = require('../electron/cashier-receipt-escpos/escpos-format.cjs');

test('restaurant receipt formats quantities with uzbek units', () => {
  assert.equal(fmtQty(200, 'WEIGHT', 'g'), '200 g');
  assert.equal(fmtQty(1.5, 'WEIGHT', 'kg'), '1.5 kg');
  assert.equal(fmtQty(0.5, 'WEIGHT'), '0.5 kg');
  assert.equal(fmtQty(0.75, 'WEIGHT', 'litr'), '0.75 litr');
  assert.equal(fmtQty(2, 'PIECE'), '2');
});

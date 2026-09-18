/**
 * Модуль печати должен загружаться. Иначе Electron ставит заглушку
 * «Печать чека недоступна в этой сборке» и чек до принтера не доходит.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ESCPOS_DIR = path.join(__dirname, '../electron/cashier-receipt-escpos');

test('every cashier escpos module loads', () => {
  const files = fs
    .readdirSync(ESCPOS_DIR)
    .filter((name) => name.endsWith('.cjs') && name !== 'package.json');

  assert.ok(files.length >= 8, 'escpos package is missing modules');
  for (const name of files) {
    assert.doesNotThrow(() => {
      delete require.cache[require.resolve(path.join(ESCPOS_DIR, name))];
      require(path.join(ESCPOS_DIR, name));
    }, `${name} failed to load`);
  }
});

test('receipt print driver registers a real handler, not the missing-driver stub', () => {
  const escpos = require(path.join(ESCPOS_DIR, 'index.cjs'));
  const printer = require(path.join(ESCPOS_DIR, 'escpos-printer-service.cjs'));

  assert.equal(typeof escpos.registerEscposIpcHandlers, 'function');
  assert.equal(typeof escpos.printSaleReceiptEscpos, 'function');
  assert.equal(typeof printer.createReceiptPrinter, 'function');
  assert.equal(typeof printer.resolvePrintWidth, 'function');
  assert.equal(printer.RECEIPT_WIDTH_CHARS, undefined);

  assert.equal(printer.resolvePrintWidth({ paperWmm: 58 }), 32);
  assert.equal(printer.resolvePrintWidth({ paperWmm: 80 }), 42);
});

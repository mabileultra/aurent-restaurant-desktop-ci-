const { test } = require('node:test');
const assert = require('node:assert/strict');
const { matchPrinterName } = require('../electron/printers/printer-match.cjs');

test('matchPrinterName exact and case-insensitive', () => {
  const printers = [{ name: 'XP-80C' }, { name: 'Microsoft Print to PDF' }];
  assert.equal(matchPrinterName('XP-80C', printers), 'XP-80C');
  assert.equal(matchPrinterName('xp-80c', printers), 'XP-80C');
  assert.equal(matchPrinterName('missing', printers), null);
});

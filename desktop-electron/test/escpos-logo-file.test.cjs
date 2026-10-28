const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const { writeLogoPngTempFile } = require('../electron/cashier-receipt-escpos/escpos-logo-file.cjs');

// 1x1 transparent PNG data URL
const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test('writeLogoPngTempFile returns null for empty or invalid input', () => {
  assert.equal(writeLogoPngTempFile(null, 'test'), null);
  assert.equal(writeLogoPngTempFile('', 'test'), null);
  assert.equal(writeLogoPngTempFile('not-a-data-url', 'test'), null);
  assert.equal(writeLogoPngTempFile('http://example.com/logo.png', 'test'), null);
  assert.equal(writeLogoPngTempFile('data:text/plain;base64,SGVsbG8=', 'test'), null);
});

test('writeLogoPngTempFile writes PNG temp file and returns absolute path', () => {
  const stem = `test-logo-${Date.now()}`;
  const filePath = writeLogoPngTempFile(TINY_PNG_DATA_URL, stem);

  assert.ok(filePath, 'Must return a file path');
  assert.ok(fs.existsSync(filePath), 'File must exist on disk');

  const stat = fs.statSync(filePath);
  assert.ok(stat.size > 0, 'File must not be empty');

  // Verify PNG header bytes: 0x89 0x50 0x4E 0x47
  const buffer = fs.readFileSync(filePath);
  assert.equal(buffer[0], 0x89);
  assert.equal(buffer[1], 0x50); // P
  assert.equal(buffer[2], 0x4E); // N
  assert.equal(buffer[3], 0x47); // G

  // Cleanup
  fs.unlinkSync(filePath);
  assert.ok(!fs.existsSync(filePath), 'Temp file cleaned up');
});

test('writeLogoPngTempFile respects maxHeightMm bounds without error', () => {
  const stem = `test-logo-height-${Date.now()}`;
  const filePath = writeLogoPngTempFile(TINY_PNG_DATA_URL, stem, { maxHeightMm: 50 });

  assert.ok(filePath);
  assert.ok(fs.existsSync(filePath));

  fs.unlinkSync(filePath);
});

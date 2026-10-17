const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildPluWritePacket,
  encodeUintLe,
} = require('../electron/scales/scale-shtrih-udp.cjs');

test('buildPluWritePacket: STX + LEN + CMD 0x50', () => {
  const p = buildPluWritePacket({ plu: '12', name: 'Test', pricePerKg: 100 });
  assert.equal(p[0], 0x02);
  assert.equal(p[2], 0x50);
  assert.equal(p[1], p.length - 2);
  assert.equal(p[1], 84);
});

test('encodeUintLe little-endian', () => {
  assert.deepEqual([...encodeUintLe(12, 2)], [0x0c, 0x00]);
  assert.deepEqual([...encodeUintLe(1500000, 4)], [0x60, 0xe3, 0x16, 0x00]);
});

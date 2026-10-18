const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildPluWritePacket,
  encodeUintLe,
  parseScaleReply,
} = require('../electron/scales/scale-shtrih-udp.cjs');

test('buildPluWritePacket: STX + LEN + CMD 0x50, пароль ASCII 0030, код сообщения 0', () => {
  const p = buildPluWritePacket({ plu: '12', name: 'Test', pricePerKg: 100 });
  assert.equal(p[0], 0x02);
  assert.equal(p[2], 0x50);
  assert.equal(p[1], p.length - 2);
  assert.equal(p[1], 84);
  assert.deepEqual([...p.subarray(3, 7)], [0x30, 0x30, 0x33, 0x30]);
  assert.deepEqual([...p.subarray(79, 81)], [0x00, 0x00]);
});

test('buildPluWritePacket: длинное имя уходит во вторую строку', () => {
  const name = 'Яблоки сезонные красные сладкие отборные';
  const p = buildPluWritePacket({ plu: '7', name, pricePerKg: 12.5 });
  const line2 = p.subarray(41, 69);
  assert.ok([...line2].some((b) => b !== 0));
});

test('parseScaleReply: код 0 — товар записан', () => {
  assert.deepEqual(parseScaleReply(Buffer.from([0x02, 0x02, 0x50, 0x00])), { cmd: 0x50, result: 0 });
  assert.equal(parseScaleReply(Buffer.from([0x04, 0x00, 0x00, 0x00, 0x02, 0x02, 0x50, 0x03])).result, 3);
  assert.equal(parseScaleReply(Buffer.from([0x02, 0x01])), null);
});

test('encodeUintLe little-endian', () => {
  assert.deepEqual([...encodeUintLe(12, 2)], [0x0c, 0x00]);
  assert.deepEqual([...encodeUintLe(1500000, 4)], [0x60, 0xe3, 0x16, 0x00]);
});

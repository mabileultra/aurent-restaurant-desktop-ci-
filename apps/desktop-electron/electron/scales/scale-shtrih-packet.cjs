'use strict';
/**
 * Кадры протокола Штрих для ШТРИХ-ПРИНТ (без транспорта).
 * STX | LEN | CMD | DATA… — CRC на проводе сейчас не шлём (как Загрузчик в нашем пути).
 */
const DEFAULT_UDP_PORT = 1111;
const DEFAULT_PASSWORD = '0030';
const DEFAULT_LOCAL_UDP_PORT = 2000;
const PLU_WRITE_CMD = 0x50;
const MAX_WEIGHT_GRAMS = 500000;

function charToWin1251(ch) {
  const c = ch.codePointAt(0);
  if (c < 0x80) return c;
  if (c >= 0x410 && c <= 0x44f) return c - 0x350;
  if (c === 0x401) return 0xa8;
  if (c === 0x451) return 0xb8;
  if (c === 0x404) return 0xaa;
  if (c === 0x454) return 0xba;
  if (c === 0x407) return 0xaf;
  if (c === 0x457) return 0xbf;
  if (c === 0x406) return 0xb2;
  if (c === 0x456) return 0xb3;
  if (c === 0x490) return 0xa5;
  if (c === 0x491) return 0xb4;
  return 0x3f;
}

function encodeWin1251Padded(text, length) {
  const s = String(text || '');
  const raw = Buffer.alloc(Math.min(s.length, length));
  for (let i = 0; i < raw.length; i += 1) raw[i] = charToWin1251(s[i]);
  if (raw.length >= length) return raw.subarray(0, length);
  return Buffer.concat([raw, Buffer.alloc(length - raw.length)]);
}

function encodeUintLe(value, byteLength) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  const buf = Buffer.alloc(byteLength);
  if (byteLength === 1) buf.writeUInt8(n & 0xff, 0);
  else if (byteLength === 2) buf.writeUInt16LE(n & 0xffff, 0);
  else if (byteLength === 4) buf.writeUInt32LE(n >>> 0, 0);
  else throw new Error('encodeUintLe: unsupported length ' + byteLength);
  return buf;
}

function encodePassword(password = DEFAULT_PASSWORD) {
  const digits = String(password || DEFAULT_PASSWORD).replace(/\D/g, '').padStart(4, '0').slice(-4);
  return Buffer.from(digits, 'ascii');
}

function splitName(name) {
  const text = String(name || '').trim();
  return [text.slice(0, 28), text.slice(28, 56)];
}

function buildPluWritePacket(item, { password = DEFAULT_PASSWORD } = {}) {
  const pluNum = Math.max(1, Math.min(65535, parseInt(String(item.plu), 10) || 0));
  if (!pluNum) throw new Error('Некорректный PLU: ' + item.plu);

  const priceRaw = Number(item.pricePerKg);
  const priceUnits = Number.isFinite(priceRaw)
    ? Math.min(999999, Math.max(0, Math.round(priceRaw * 100)))
    : 0;
  const [name1, name2] = splitName(String(item.name || '').trim() || ('PLU ' + pluNum));
  const shelfDays = Math.max(0, Math.min(9999, Number(item.shelfLifeDays) || 0));
  const tareGrams = Math.max(0, Math.min(65535, Number(item.tareGrams) || 0));
  const groupCode = Math.max(0, Math.min(9999, Number(item.groupCode) || 0));

  const body = Buffer.concat([
    Buffer.from([PLU_WRITE_CMD]),
    encodePassword(password),
    encodeUintLe(pluNum, 2),
    encodeUintLe(pluNum, 4),
    encodeWin1251Padded(name1, 28),
    encodeWin1251Padded(name2, 28),
    encodeUintLe(priceUnits, 4),
    encodeUintLe(shelfDays, 2),
    encodeUintLe(tareGrams, 2),
    encodeUintLe(groupCode, 2),
    encodeUintLe(0, 2),
    encodeUintLe(0, 1),
    encodeUintLe(0, 4),
  ]);
  return Buffer.concat([Buffer.from([0x02, body.length]), body]);
}

/** ШТРИХ-ПРИНТ 4.5: 0x11 без пароля. */
function buildWeightRequestPacket() {
  return Buffer.from([0x02, 0x01, 0x11]);
}

function parseScaleReply(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 4) return null;
  let off = 0;
  if (buf[0] !== 0x02 && buf.length >= 8 && buf[4] === 0x02) off = 4;
  if (buf[off] !== 0x02) return null;
  const cmdAt = buf[off + 1] === 0xff ? off + 4 : off + 2;
  if (buf.length < cmdAt + 2) return null;
  return { cmd: buf[cmdAt], result: buf[cmdAt + 1] };
}

function resultText(code) {
  const known = {
    1: 'ошибка параметров',
    2: 'неверная команда',
    3: 'неверный пароль (по умолчанию 0030, после 5 ошибок весы блокируют интерфейс до перезагрузки)',
    0x79: 'неверная длина данных команды',
  };
  return known[code] || ('код ' + code);
}

function parseShtrihWeightReply(buf) {
  const parsed = parseScaleReply(buf);
  if (!parsed || parsed.cmd !== 0x11 || parsed.result !== 0) return null;
  let off = 0;
  if (buf[0] !== 0x02 && buf.length >= 8 && buf[4] === 0x02) off = 4;
  const cmdAt = buf[off + 1] === 0xff ? off + 4 : off + 2;
  const data = buf.subarray(cmdAt + 2);
  let grams = null;
  let stable = true;
  if (data.length >= 4) {
    grams = buf.readInt32LE(cmdAt + 2);
    if (data.length >= 5) stable = data[4] !== 0;
  } else if (data.length >= 2) {
    grams = buf.readInt16LE(cmdAt + 2);
    if (data.length >= 3) stable = data[2] !== 0;
  }
  if (grams == null || !Number.isFinite(grams)) return null;
  const abs = Math.abs(grams);
  if (abs > MAX_WEIGHT_GRAMS) return null;
  return {
    kg: Math.round((abs / 1000) * 1000) / 1000,
    stable,
    raw: buf.toString('hex'),
  };
}

module.exports = {
  DEFAULT_UDP_PORT,
  DEFAULT_PASSWORD,
  DEFAULT_LOCAL_UDP_PORT,
  encodeWin1251Padded,
  encodeUintLe,
  buildPluWritePacket,
  buildWeightRequestPacket,
  parseScaleReply,
  parseShtrihWeightReply,
  resultText,
};

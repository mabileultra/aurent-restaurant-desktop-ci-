/**
 * Протокол «Штрих» по UDP для ШТРИХ-ПРИНТ (Ethernet).
 * Формат: STX(02) | LEN | CMD | DATA…  (как в открытых драйверах / Загрузчике).
 * Порт весов по умолчанию: 1111. Пароль сервиса: «0030».
 */
const dgram = require('dgram');

const DEFAULT_UDP_PORT = 1111;
const DEFAULT_PASSWORD = '0030';
const PLU_WRITE_CMD = 0x50;
const ITEM_GAP_MS = 450;

/** Unicode → байт Windows-1251 (кириллица + ASCII). */
function charToWin1251(ch) {
  const c = ch.codePointAt(0);
  if (c < 0x80) return c;
  if (c >= 0x410 && c <= 0x44f) return c - 0x350; // А-я
  if (c === 0x401) return 0xa8; // Ё
  if (c === 0x451) return 0xb8; // ё
  if (c === 0x404) return 0xaa; // Є
  if (c === 0x454) return 0xba;
  if (c === 0x407) return 0xaf; // Ї
  if (c === 0x457) return 0xbf;
  if (c === 0x406) return 0xb2; // І
  if (c === 0x456) return 0xb3;
  if (c === 0x490) return 0xa5; // Ґ
  if (c === 0x491) return 0xb4;
  return 0x3f; // ?
}

function encodeWin1251Padded(text, length) {
  const s = String(text || '');
  const raw = Buffer.alloc(Math.min(s.length, length));
  for (let i = 0; i < raw.length; i += 1) {
    raw[i] = charToWin1251(s[i]);
  }
  if (raw.length >= length) return raw.subarray(0, length);
  return Buffer.concat([raw, Buffer.alloc(length - raw.length)]);
}

/** Число → little-endian hex-байты фиксированной длины. */
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
  return encodeWin1251Padded(String(password || DEFAULT_PASSWORD).padStart(4, '0').slice(0, 4), 4);
}

/**
 * Пакет записи одного PLU (команда 0x50).
 * @returns {Buffer}
 */
function buildPluWritePacket(item, { password = DEFAULT_PASSWORD } = {}) {
  const pluNum = Math.max(1, Math.min(65535, parseInt(String(item.plu), 10) || 0));
  if (!pluNum) throw new Error('Некорректный PLU: ' + item.plu);

  // Цена в минимальных единицах (тийин/копейки): 12.50 → 1250; целые сумы → *100 если есть дробь, иначе как есть*100 для единообразия.
  const priceRaw = Number(item.pricePerKg);
  const priceUnits = Number.isFinite(priceRaw)
    ? Math.round(priceRaw * 100)
    : 0;

  const name = String(item.name || '').trim() || ('PLU ' + pluNum);
  const shelfDays = Math.max(0, Math.min(65535, Number(item.shelfLifeDays) || 0));
  const groupCode = Math.max(0, Math.min(65535, Number(item.groupCode) || 1));

  const body = Buffer.concat([
    Buffer.from([PLU_WRITE_CMD]),
    encodePassword(password),
    encodeUintLe(pluNum, 2),
    encodeUintLe(pluNum, 4), // код товара
    encodeWin1251Padded(name, 28),
    encodeWin1251Padded('', 28), // вторая строка имени
    encodeUintLe(priceUnits, 4),
    encodeUintLe(shelfDays, 2),
    encodeUintLe(0, 2), // тара
    encodeUintLe(groupCode, 2),
    encodeUintLe(pluNum, 2), // номер на клавиатуре
    encodeUintLe(0, 1), // картинка
    encodeUintLe(0, 4), // доп. поле (срок/росстест-слот)
  ]);

  const len = body.length; // LEN = CMD + DATA
  return Buffer.concat([Buffer.from([0x02, len]), body]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Отправка UDP-датаграмм на весы (fire-and-forget с паузой, как у Загрузчика).
 */
async function sendUdpPackets(host, udpPort, packets, { localPort = 0 } = {}) {
  const socket = dgram.createSocket('udp4');
  await new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.bind(localPort, () => resolve());
  });

  try {
    for (let i = 0; i < packets.length; i += 1) {
      const buf = packets[i];
      await new Promise((resolve, reject) => {
        socket.send(buf, udpPort, host, (err) => (err ? reject(err) : resolve()));
      });
      if (i < packets.length - 1) await sleep(ITEM_GAP_MS);
    }
  } finally {
    try { socket.close(); } catch { /* ignore */ }
  }
}

/**
 * Выгрузка списка PLU на ШТРИХ-ПРИНТ по UDP.
 * @param {Array<{plu:string,name:string,pricePerKg:number}>} items
 * @param {{host:string,udpPort?:number,password?:string}} opts
 */
async function pushPluToShtrih(items, opts = {}) {
  const host = String(opts.host || '').trim();
  const udpPort = Number(opts.udpPort) || DEFAULT_UDP_PORT;
  if (!host) {
    return { ok: false, message: 'Не указан IP весов. Aurent → Весы → Ethernet → сохраните IP.' };
  }
  const list = Array.isArray(items) ? items.filter((row) => row && row.plu) : [];
  if (!list.length) {
    return { ok: false, message: 'Нет товаров с PLU для выгрузки' };
  }

  const packets = [];
  const errors = [];
  for (const row of list) {
    try {
      packets.push(buildPluWritePacket(row, { password: opts.password || DEFAULT_PASSWORD }));
    } catch (err) {
      errors.push({ plu: row.plu, error: err?.message || String(err) });
    }
  }
  if (!packets.length) {
    return { ok: false, message: 'Не удалось собрать пакеты PLU', errors };
  }

  try {
    await sendUdpPackets(host, udpPort, packets);
  } catch (err) {
    return {
      ok: false,
      message: 'UDP ошибка: ' + (err?.message || String(err)),
      host,
      udpPort,
      errors,
    };
  }

  return {
    ok: true,
    pushed: packets.length,
    skipped: errors.length,
    host,
    udpPort,
    errors: errors.length ? errors : undefined,
    hint: 'PLU отправлены. На весах наберите код PLU — должен появиться товар.',
  };
}

/**
 * Быстрая проверка: шлём пустой/короткий пакет записи с тестовым PLU=0 не делаем —
 * просто UDP bind + send нулевого echo ненадёжен. Используем одну запись «служебную» не надо.
 * Проверка связи = успешный send на порт (ICMP ping отдельно).
 */
async function probeShtrihUdp(host, udpPort = DEFAULT_UDP_PORT) {
  const h = String(host || '').trim();
  const port = Number(udpPort) || DEFAULT_UDP_PORT;
  if (!h) return { ok: false, error: 'no-host' };
  try {
    // Команда «гудок»/статус в разных прошивках разная; шлём минимальный валидный PLU-пакет
    // с plu=1 name=TEST только если opts.writeTest — здесь только open+send length check.
    const socket = dgram.createSocket('udp4');
    await new Promise((resolve, reject) => {
      socket.once('error', reject);
      socket.bind(0, () => resolve());
    });
    const probe = Buffer.from([0x02, 0x01, 0x11, 0x12]); // короткий ping-like (как в QZ Gudok-вариантах)
    await new Promise((resolve, reject) => {
      socket.send(probe, port, h, (err) => (err ? reject(err) : resolve()));
    });
    socket.close();
    return { ok: true, host: h, udpPort: port };
  } catch (err) {
    return { ok: false, host: h, udpPort: port, error: err?.message || String(err) };
  }
}

module.exports = {
  DEFAULT_UDP_PORT,
  DEFAULT_PASSWORD,
  encodeWin1251Padded,
  encodeUintLe,
  buildPluWritePacket,
  pushPluToShtrih,
  probeShtrihUdp,
};

/**
 * Протокол «Штрих» по UDP для ШТРИХ-ПРИНТ (Ethernet).
 * Формат: STX(02) | LEN | CMD | DATA…  (как в открытых драйверах / Загрузчике).
 * Порт весов по умолчанию: 1111. Пароль сервиса: «0030».
 */
const dgram = require('dgram');

const DEFAULT_UDP_PORT = 1111;
const DEFAULT_PASSWORD = '0030';
const PLU_WRITE_CMD = 0x50;

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
  const digits = String(password || DEFAULT_PASSWORD).replace(/\D/g, '').padStart(4, '0').slice(-4);
  return Buffer.from(digits, 'ascii');
}

function splitName(name) {
  const text = String(name || '').trim();
  return [text.slice(0, 28), text.slice(28, 56)];
}

/**
 * Пакет записи одного PLU (команда 0x50).
 * Поле после группы — код сообщения, 0 = не задано. Ненулевой код без
 * сообщения в памяти весов они отклоняют, и товар в PLU не попадает.
 * @returns {Buffer}
 */
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

  const len = body.length;
  return Buffer.concat([Buffer.from([0x02, len]), body]);
}

/**
 * Прошивка ШТРИХ-ПРИНТ 4.5: команда 0x11 без пароля.
 * `02 05 11` + ASCII-пароль весы отвергают кодом 0x79 (121, неверная длина).
 */
function buildWeightRequestPacket() {
  return Buffer.from([0x02, 0x01, 0x11]);
}

/**
 * Ответ 0x50: STX | LEN | CMD | код результата. 0 — товар записан в память.
 * TCP-кадр может начинаться с длины uint32 LE.
 */
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

const MAX_WEIGHT_GRAMS = 500000;

/**
 * Успешный ответ 0x11: STX | LEN | 11 | 00 | вес int32 LE в граммах | стабильность (0/1).
 * Короткий ответ — int16 LE. Код результата не 0 — веса нет.
 */
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

function createShtrihWeightPoller(host, udpPort, onReading) {
  const h = String(host || '').trim();
  const port = Number(udpPort) || DEFAULT_UDP_PORT;
  let stopped = false;
  let timer = null;
  const socket = dgram.createSocket('udp4');
  socket.on('error', () => {});

  async function tick() {
    if (stopped) return;
    try {
      const pending = waitForUdp(socket, 700);
      await sendUdp(socket, buildWeightRequestPacket(), port, h);
      const raw = await pending;
      const reading = parseShtrihWeightReply(raw);
      if (reading && typeof onReading === 'function') onReading(reading);
    } catch {
      /* таймаут или нет сокета — следующий тик */
    }
    if (!stopped) timer = setTimeout(tick, 250);
  }

  socket.bind(0, () => {
    if (!stopped) tick();
  });

  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      try { socket.close(); } catch { /* ignore */ }
    },
  };
}

function waitForUdp(socket, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.removeListener('message', onMessage);
      const err = new Error('timeout');
      err.code = 'TIMEOUT';
      reject(err);
    }, ms);
    const onMessage = (msg) => {
      clearTimeout(timer);
      resolve(msg);
    };
    socket.once('message', onMessage);
  });
}

function sendUdp(socket, buf, port, host) {
  return new Promise((resolve, reject) => {
    socket.send(buf, port, host, (err) => (err ? reject(err) : resolve()));
  });
}

async function pushViaUdp(host, port, packets) {
  const socket = dgram.createSocket('udp4');
  await new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.bind(0, () => {
      socket.removeAllListeners('error');
      socket.on('error', () => { /* ошибку отдаёт send/wait */ });
      resolve();
    });
  });

  let answered = false;
  let pushed = 0;
  try {
    for (let i = 0; i < packets.length; i += 1) {
      const pending = waitForUdp(socket, i === 0 ? 1600 : 1000);
      await sendUdp(socket, packets[i].buf, port, host);
      let raw;
      try {
        raw = await pending;
      } catch (err) {
        if (err?.code === 'TIMEOUT') {
          return {
            answered,
            ok: false,
            pushed,
            transport: 'udp',
            message: answered
              ? `Весы перестали отвечать после ${pushed} PLU`
              : `Весы не ответили по UDP ${host}:${port}`,
          };
        }
        throw err;
      }
      answered = true;
      const parsed = parseScaleReply(raw);
      if (!parsed) {
        return {
          answered: true,
          ok: false,
          pushed,
          transport: 'udp',
          message: `Весы ${host}:${port} прислали непонятный ответ на PLU ${packets[i].plu}`,
        };
      }
      if (parsed.result !== 0) {
        return {
          answered: true,
          ok: false,
          pushed,
          transport: 'udp',
          result: parsed.result,
          message: `Весы отклонили PLU ${packets[i].plu}: ${resultText(parsed.result)}`,
        };
      }
      pushed += 1;
    }
    return { answered: true, ok: true, pushed, transport: 'udp' };
  } finally {
    try { socket.close(); } catch { /* ignore */ }
  }
}

function readTcpReply(socket, ms) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const timer = setTimeout(() => done(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), ms);
    const onData = (chunk) => {
      chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      if (parseScaleReply(buf)) done(null, buf);
    };
    const done = (err, buf) => {
      clearTimeout(timer);
      socket.removeListener('data', onData);
      if (err) reject(err);
      else resolve(buf);
    };
    socket.on('data', onData);
  });
}

async function pushViaTcp(host, port, packets) {
  const net = require('net');
  const socket = net.connect({ host, port });
  let answered = false;
  let pushed = 0;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), 1600);
      socket.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });
      socket.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
    for (let i = 0; i < packets.length; i += 1) {
      const len = Buffer.alloc(4);
      len.writeUInt32LE(packets[i].buf.length, 0);
      const pending = readTcpReply(socket, i === 0 ? 1600 : 1000);
      socket.write(Buffer.concat([len, packets[i].buf]));
      let raw;
      try {
        raw = await pending;
      } catch (err) {
        if (err?.code === 'TIMEOUT') {
          return {
            answered,
            ok: false,
            pushed,
            transport: 'tcp',
            message: answered
              ? `Весы перестали отвечать после ${pushed} PLU`
              : `Весы не ответили по TCP ${host}:${port}`,
          };
        }
        throw err;
      }
      answered = true;
      const parsed = parseScaleReply(raw);
      if (!parsed || parsed.result !== 0) {
        const code = parsed ? parsed.result : null;
        return {
          answered: true,
          ok: false,
          pushed,
          transport: 'tcp',
          result: code,
          message: parsed
            ? `Весы отклонили PLU ${packets[i].plu}: ${resultText(code)}`
            : `Весы ${host}:${port} прислали непонятный ответ на PLU ${packets[i].plu}`,
        };
      }
      pushed += 1;
    }
    return { answered: true, ok: true, pushed, transport: 'tcp' };
  } catch (err) {
    return {
      answered: false,
      ok: false,
      pushed,
      transport: 'tcp',
      message: `TCP ${host}:${port}: ${err?.message || err}`,
    };
  } finally {
    try { socket.destroy(); } catch { /* ignore */ }
  }
}

function candidatePorts(udpPort) {
  const primary = Number(udpPort) || DEFAULT_UDP_PORT;
  const ports = [primary];
  if (primary !== DEFAULT_UDP_PORT) ports.push(DEFAULT_UDP_PORT);
  return ports;
}

/**
 * Выгрузка PLU. Успех — только когда весы ответили кодом 0 (товар в памяти).
 * Сначала UDP, при тишине — TCP с префиксом длины. Если порт не 1111, пробуем и 1111.
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
      packets.push({
        plu: row.plu,
        buf: buildPluWritePacket(row, { password: opts.password || DEFAULT_PASSWORD }),
      });
    } catch (err) {
      errors.push({ plu: row.plu, error: err?.message || String(err) });
    }
  }
  if (!packets.length) {
    return { ok: false, message: 'Не удалось собрать пакеты PLU', errors };
  }

  const notes = [];
  for (const port of candidatePorts(udpPort)) {
    for (const via of [pushViaUdp, pushViaTcp]) {
      let attempt;
      try {
        attempt = await via(host, port, packets);
      } catch (err) {
        notes.push(`${host}:${port} — ${err?.message || err}`);
        continue;
      }
      if (attempt.answered && attempt.ok) {
        return {
          ok: true,
          pushed: attempt.pushed,
          skipped: errors.length,
          host,
          udpPort: port,
          transport: attempt.transport,
          errors: errors.length ? errors : undefined,
          hint: `PLU записаны в память (${attempt.transport.toUpperCase()} ${host}:${port}). Наберите номер PLU на весах.`,
        };
      }
      if (attempt.answered) {
        return {
          ok: false,
          pushed: attempt.pushed || 0,
          host,
          udpPort: port,
          message: attempt.message,
          errors: errors.length ? errors : undefined,
        };
      }
      if (attempt.message) notes.push(attempt.message);
    }
  }

  return {
    ok: false,
    pushed: 0,
    host,
    udpPort,
    message: notes[0] || `Весы ${host} не подтвердили запись в память. Проверьте Ethernet, UDP-порт 1111 и пароль 0030.`,
    errors: errors.length ? errors : undefined,
  };
}

/**
 * Проверка связи: запрос веса 02 01 11 без пароля. Успешный send() без ответа — не связь.
 */
async function probeShtrihUdp(host, udpPort = DEFAULT_UDP_PORT, timeoutMs = 1200) {
  const h = String(host || '').trim();
  const port = Number(udpPort) || DEFAULT_UDP_PORT;
  if (!h) return { ok: false, error: 'no-host' };
  const socket = dgram.createSocket('udp4');
  try {
    await new Promise((resolve, reject) => {
      socket.once('error', reject);
      socket.bind(0, () => resolve());
    });
    const pending = waitForUdp(socket, timeoutMs);
    await sendUdp(socket, buildWeightRequestPacket(), port, h);
    const raw = await pending;
    const parsed = parseScaleReply(raw);
    if (!parsed) return { ok: false, host: h, udpPort: port, error: 'bad-reply' };
    return { ok: true, host: h, udpPort: port, result: parsed.result };
  } catch (err) {
    return { ok: false, host: h, udpPort: port, error: err?.code === 'TIMEOUT' ? 'нет ответа' : (err?.message || String(err)) };
  } finally {
    try { socket.close(); } catch { /* ignore */ }
  }
}

module.exports = {
  DEFAULT_UDP_PORT,
  DEFAULT_PASSWORD,
  encodeWin1251Padded,
  encodeUintLe,
  buildPluWritePacket,
  buildWeightRequestPacket,
  parseScaleReply,
  parseShtrihWeightReply,
  pushPluToShtrih,
  probeShtrihUdp,
  createShtrihWeightPoller,
};

'use strict';
/**
 * UDP-эмулятор ШТРИХ-ПРИНТ (без CRC, как клиент).
 * node scale-shtrih-mock.cjs
 */
const dgram = require('dgram');
const { DEFAULT_UDP_PORT, DEFAULT_PASSWORD } = require('./scale-shtrih-packet.cjs');

const PORT = Number(process.env.POS_SCALE_MOCK_PORT || DEFAULT_UDP_PORT) || DEFAULT_UDP_PORT;
const PASSWORD = String(process.env.POS_SCALE_PASSWORD || DEFAULT_PASSWORD);
const WEIGHT_G = Number(process.env.POS_SCALE_MOCK_WEIGHT_G || 1234) || 1234;

function buildReply(cmd, err, payload = Buffer.alloc(0)) {
  const extra = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  const body = Buffer.concat([Buffer.from([cmd & 0xff, err & 0xff]), extra]);
  return Buffer.concat([Buffer.from([0x02, body.length]), body]);
}

function parseRequest(raw) {
  if (!Buffer.isBuffer(raw) || raw.length < 3 || raw[0] !== 0x02) return { error: 'not a frame' };
  const len = raw[1];
  if (raw.length < 2 + len || len < 1) return { error: 'bad length' };
  const body = raw.subarray(2, 2 + len);
  return { cmd: body[0], data: body.subarray(1) };
}

function startShtrihMock(opts = {}) {
  const host = String(opts.host || '127.0.0.1');
  const wantPort = opts.port == null ? PORT : Number(opts.port);
  const password = String(opts.password || PASSWORD);
  const weightGrams = opts.weightGrams == null ? WEIGHT_G : Number(opts.weightGrams);
  const log = typeof opts.log === 'function' ? opts.log : console.log;
  const pluDb = opts.pluDb || new Map();
  const sock = dgram.createSocket('udp4');

  sock.on('message', (msg, rinfo) => {
    const parsed = parseRequest(msg);
    if (parsed.error) {
      log(`[mock] битый кадр: ${parsed.error} hex=${msg.toString('hex')}`);
      return;
    }
    let reply;
    if (parsed.cmd === 0x11) {
      const w = Buffer.alloc(5);
      w.writeInt32LE(weightGrams, 0);
      w[4] = 1;
      reply = buildReply(0x11, 0, w);
    } else if (parsed.cmd === 0x50) {
      const data = parsed.data;
      if (!data || data.length < 70) {
        reply = buildReply(0x50, 1);
      } else if (data.subarray(0, 4).toString('ascii') !== password) {
        log(`[mock] отказ пароля`);
        reply = buildReply(0x50, 3);
      } else {
        const plu = data.readUInt16LE(4);
        const price = data.readUInt32LE(66);
        pluDb.set(plu, { price });
        log(`[mock] PLU #${plu} price=${(price / 100).toFixed(2)} (всего ${pluDb.size})`);
        reply = buildReply(0x50, 0);
      }
    } else {
      reply = buildReply(parsed.cmd, 2);
    }
    sock.send(reply, rinfo.port, rinfo.address);
  });

  return new Promise((resolve, reject) => {
    sock.once('error', reject);
    sock.bind(wantPort, host, () => {
      sock.removeListener('error', reject);
      sock.on('error', (e) => log('[mock]', e.message));
      const addr = sock.address();
      log(`[mock] ШТРИХ на ${addr.address}:${addr.port}, пароль ${password}`);
      resolve({
        host: addr.address,
        port: addr.port,
        pluDb,
        stop: () => new Promise((res) => {
          try { sock.close(() => res()); } catch { res(); }
        }),
      });
    });
  });
}

module.exports = { startShtrihMock, buildReply, parseRequest };

if (require.main === module) {
  startShtrihMock().catch((err) => {
    console.error('[mock]', err?.message || err);
    process.exit(1);
  });
}

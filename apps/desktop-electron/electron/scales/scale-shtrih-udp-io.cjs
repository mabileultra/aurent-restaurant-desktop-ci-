'use strict';
/**
 * Транспорт UDP/TCP для ШТРИХ-ПРИНТ: probe, poller, push с retry.
 */
const dgram = require('dgram');
const net = require('net');
const {
  DEFAULT_UDP_PORT,
  buildWeightRequestPacket,
  parseScaleReply,
  parseShtrihWeightReply,
  resultText,
} = require('./scale-shtrih-packet.cjs');
const { bindShtrihUdpSocket } = require('./scale-shtrih-udp-bind.cjs');

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

async function withRetries(fn, { times = 3, label = '' } = {}) {
  let last;
  for (let i = 0; i < times; i += 1) {
    last = await fn(i);
    if (last?.ok || last?.answered) return last;
  }
  if (last && label) {
    last.message = (last.message || '') + (last.message ? ' ' : '') + `(попыток: ${times})`;
  }
  return last;
}

function createShtrihWeightPoller(host, udpPort, onReading) {
  const h = String(host || '').trim();
  const port = Number(udpPort) || DEFAULT_UDP_PORT;
  let stopped = false;
  let timer = null;
  let socket = null;

  async function tick() {
    if (stopped || !socket) return;
    try {
      const pending = waitForUdp(socket, 700);
      await sendUdp(socket, buildWeightRequestPacket(), port, h);
      const raw = await pending;
      const reading = parseShtrihWeightReply(raw);
      if (reading && typeof onReading === 'function') onReading(reading);
    } catch {
      /* следующий тик */
    }
    if (!stopped) timer = setTimeout(tick, 250);
  }

  bindShtrihUdpSocket()
    .then((bound) => {
      if (stopped) {
        try { bound.socket.close(); } catch { /* ignore */ }
        return;
      }
      socket = bound.socket;
      tick();
    })
    .catch(() => {});

  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      try { socket?.close(); } catch { /* ignore */ }
      socket = null;
    },
  };
}

async function pushViaUdpOnce(host, port, packets) {
  const { socket } = await bindShtrihUdpSocket();
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

async function pushViaUdp(host, port, packets) {
  return withRetries(() => pushViaUdpOnce(host, port, packets), { times: 3, label: 'udp' });
}

function readTcpReply(socket, ms) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const timer = setTimeout(() => done(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), ms);
    const onData = (chunk) => {
      chunks.push(chunk);
      if (parseScaleReply(Buffer.concat(chunks))) done(null, Buffer.concat(chunks));
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

async function probeShtrihUdp(host, udpPort = DEFAULT_UDP_PORT, timeoutMs = 1200) {
  const h = String(host || '').trim();
  const port = Number(udpPort) || DEFAULT_UDP_PORT;
  if (!h) return { ok: false, error: 'no-host' };

  let socket;
  try {
    const bound = await bindShtrihUdpSocket();
    socket = bound.socket;
    const pending = waitForUdp(socket, timeoutMs);
    await sendUdp(socket, buildWeightRequestPacket(), port, h);
    const raw = await pending;
    const parsed = parseScaleReply(raw);
    if (!parsed) return { ok: false, host: h, udpPort: port, error: 'bad-reply', localPort: bound.localPort };
    return {
      ok: true,
      host: h,
      udpPort: port,
      result: parsed.result,
      localPort: bound.localPort,
      preferredLocal: bound.preferred,
    };
  } catch (err) {
    return {
      ok: false,
      host: h,
      udpPort: port,
      error: err?.code === 'TIMEOUT' ? 'нет ответа' : (err?.message || String(err)),
    };
  } finally {
    try { socket?.close(); } catch { /* ignore */ }
  }
}

module.exports = {
  waitForUdp,
  sendUdp,
  createShtrihWeightPoller,
  pushViaUdp,
  pushViaTcp,
  probeShtrihUdp,
};

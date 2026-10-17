/**
 * Ethernet-весы (ШТРИХ-ПРИНТ и совместимые): TCP + текстовый вес, как COM.
 * Автопоиск: локальная /24 + типичные порты.
 */
const net = require('net');
const os = require('os');
const { parseScaleLine } = require('./scale-parser.cjs');
const { writeScaleSettings } = require('./scale-config.cjs');

/** Порты, которые часто слушают label/print-весы (ШТРИХ, CAS host и т.п.). */
const COMMON_TCP_PORTS = [1001, 1111, 4001, 5001, 5555, 7778, 9100];

function localIpv4Subnets() {
  const ifaces = os.networkInterfaces();
  const out = [];
  for (const list of Object.values(ifaces || {})) {
    for (const row of list || []) {
      if (!row || row.internal || row.family !== 'IPv4') continue;
      const parts = String(row.address || '').split('.').map(Number);
      if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) continue;
      out.push({ base: `${parts[0]}.${parts[1]}.${parts[2]}`, self: row.address });
    }
  }
  return out;
}

function probeTcpHost(host, port, timeoutMs = 350) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch { /* ignore */ }
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish({ ok: true, host, port }));
    socket.once('timeout', () => finish({ ok: false, host, port, error: 'timeout' }));
    socket.once('error', (err) => finish({ ok: false, host, port, error: err?.message || 'error' }));
    try {
      socket.connect(port, host);
    } catch (err) {
      finish({ ok: false, host, port, error: err?.message || String(err) });
    }
  });
}

/**
 * Ждём текстовый вес с уже открытого TCP (как COM readline).
 */
function probeWeightOnTcp(host, port, timeoutMs = 2800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let buf = '';
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket.destroy(); } catch { /* ignore */ }
      resolve(result);
    };
    const timer = setTimeout(() => finish({ ok: false, host, port, error: 'timeout' }), timeoutMs);

    socket.setTimeout(timeoutMs);
    socket.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() || '';
      for (const line of lines) {
        const parsed = parseScaleLine(line);
        if (parsed && parsed.kg > 0) {
          finish({ ok: true, host, port, reading: parsed, reason: 'data' });
          return;
        }
      }
    });
    socket.once('error', (err) => finish({ ok: false, host, port, error: err?.message }));
    socket.once('timeout', () => finish({ ok: false, host, port, error: 'timeout' }));
    socket.connect(port, host, () => {
      // Некоторые весы ждут запрос; пустой ping / CR часто достаточно.
      try { socket.write('\r\n'); } catch { /* ignore */ }
    });
  });
}

/**
 * Быстрый скан LAN: открытые TCP на типичных портах.
 * @returns {Promise<Array<{host:string,port:number}>>}
 */
async function scanLanScaleCandidates({ concurrency = 48 } = {}) {
  const subnets = localIpv4Subnets();
  if (!subnets.length) return [];

  const jobs = [];
  for (const { base, self } of subnets) {
    for (let i = 1; i <= 254; i += 1) {
      const host = `${base}.${i}`;
      if (host === self) continue;
      for (const port of COMMON_TCP_PORTS) {
        jobs.push({ host, port });
      }
    }
  }

  const found = [];
  let idx = 0;
  async function worker() {
    while (idx < jobs.length) {
      const cur = jobs[idx];
      idx += 1;
      const res = await probeTcpHost(cur.host, cur.port, 280);
      if (res.ok) found.push({ host: cur.host, port: cur.port });
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, jobs.length) }, () => worker());
  await Promise.all(workers);
  return found;
}

/**
 * Автопоиск Ethernet-весов: сначала TCP open, затем ideally вес.
 */
async function autoDetectEthernet({ save = true } = {}) {
  const candidates = await scanLanScaleCandidates();
  if (!candidates.length) {
    return {
      ok: false,
      error: 'В локальной сети не найдены весы на типичных TCP-портах (1001, 1111, …).',
      candidates: [],
    };
  }

  for (const c of candidates) {
    const weight = await probeWeightOnTcp(c.host, c.port, 2200);
    if (weight.ok) {
      if (save) {
        writeScaleSettings({
          scaleTransport: 'ethernet',
          scaleHost: c.host,
          scaleTcpPort: c.port,
          scaleFamily: 'family-shtrih-print',
        });
      }
      return {
        ok: true,
        transport: 'ethernet',
        host: c.host,
        tcpPort: c.port,
        method: 'weight-data',
        reading: weight.reading,
        candidates,
      };
    }
  }

  // Нет потока веса — берём первый открытый порт (часто ШТРИХ без нагрузки на чаше).
  const first = candidates[0];
  if (save) {
    writeScaleSettings({
      scaleTransport: 'ethernet',
      scaleHost: first.host,
      scaleTcpPort: first.port,
      scaleFamily: 'family-shtrih-print',
    });
  }
  return {
    ok: true,
    transport: 'ethernet',
    host: first.host,
    tcpPort: first.port,
    method: 'tcp-open',
    hint: 'TCP найден. Положите товар на весы для проверки веса.',
    candidates,
  };
}

/**
 * Держит TCP-сокет и шлёт разобранный вес в onReading.
 */
function createEthernetReader(host, tcpPort, onReading) {
  let socket = null;
  let buf = '';
  let stopped = false;

  function emitFromBuffer() {
    const lines = buf.split(/\r?\n/);
    buf = lines.pop() || '';
    for (const line of lines) {
      const parsed = parseScaleLine(line);
      if (parsed) onReading(parsed);
    }
  }

  function connect() {
    if (stopped) return;
    socket = new net.Socket();
    socket.setKeepAlive(true, 10000);
    socket.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      emitFromBuffer();
    });
    socket.on('error', () => {
      try { socket.destroy(); } catch { /* ignore */ }
      socket = null;
      if (!stopped) setTimeout(connect, 1500);
    });
    socket.on('close', () => {
      socket = null;
      if (!stopped) setTimeout(connect, 1500);
    });
    socket.connect(tcpPort, host, () => {
      try { socket.write('\r\n'); } catch { /* ignore */ }
    });
  }

  connect();

  return {
    stop() {
      stopped = true;
      try { socket?.destroy(); } catch { /* ignore */ }
      socket = null;
    },
  };
}

module.exports = {
  COMMON_TCP_PORTS,
  localIpv4Subnets,
  probeTcpHost,
  probeWeightOnTcp,
  scanLanScaleCandidates,
  autoDetectEthernet,
  createEthernetReader,
};

'use strict';
/**
 * Умный поиск ШТРИХ: сначала известные IP, потом скан /24 UDP 1111.
 */
const { readScaleSettings } = require('./scale-config.cjs');
const { localIpv4Subnets } = require('./scale-ethernet-net.cjs');
const { probeShtrihUdp } = require('./scale-shtrih-udp-io.cjs');
const { DEFAULT_UDP_PORT } = require('./scale-shtrih-packet.cjs');

/** Заводской IP ШТРИХ-ПРИНТ из мануала. */
const FACTORY_HOSTS = ['192.168.0.202', '192.168.1.202'];

function uniqHosts(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const host = String(row?.host || row || '').trim();
    const udpPort = Number(row?.udpPort || row?.tcpPort || DEFAULT_UDP_PORT) || DEFAULT_UDP_PORT;
    if (!host) continue;
    const key = `${host}:${udpPort}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ host, udpPort, label: row?.label || '' });
  }
  return out;
}

function knownHostCandidates(extra = []) {
  const settings = readScaleSettings();
  const fromSettings = [
    ...(settings.hosts || []),
    settings.host ? { host: settings.host, udpPort: settings.tcpPort } : null,
  ].filter(Boolean);
  const fromEnv = String(process.env.POS_SCALE_HOST || '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
    .map((host) => ({ host, udpPort: DEFAULT_UDP_PORT }));
  return uniqHosts([
    ...extra,
    ...fromSettings,
    ...fromEnv,
    ...FACTORY_HOSTS.map((host) => ({ host, udpPort: DEFAULT_UDP_PORT })),
  ]);
}

async function probeKnownShtrihHosts({ timeoutMs = 500, extra = [] } = {}) {
  const list = knownHostCandidates(extra);
  const found = [];
  for (const row of list) {
    const res = await probeShtrihUdp(row.host, row.udpPort, timeoutMs);
    if (res.ok) {
      found.push({
        host: res.host,
        udpPort: res.udpPort || row.udpPort,
        result: res.result,
        label: row.label || '',
        method: 'known',
      });
    }
  }
  return found;
}

async function scanLanShtrihUdp({ concurrency = 32, timeoutMs = 350, skip = new Set() } = {}) {
  const subnets = localIpv4Subnets();
  const hosts = [];
  for (const { base, self } of subnets) {
    for (let i = 1; i <= 254; i += 1) {
      const host = `${base}.${i}`;
      if (host === self) continue;
      if (skip.has(`${host}:${DEFAULT_UDP_PORT}`)) continue;
      hosts.push(host);
    }
  }
  if (!hosts.length) return [];

  const found = [];
  let idx = 0;
  async function worker() {
    while (idx < hosts.length) {
      const host = hosts[idx];
      idx += 1;
      const res = await probeShtrihUdp(host, DEFAULT_UDP_PORT, timeoutMs);
      if (res.ok) {
        found.push({
          host: res.host,
          udpPort: res.udpPort || DEFAULT_UDP_PORT,
          result: res.result,
          method: 'scan',
        });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, hosts.length) }, () => worker()));
  return found;
}

/**
 * Known → full /24. Возвращает все найденные UDP-весы.
 */
async function discoverShtrihUdp(opts = {}) {
  const known = await probeKnownShtrihHosts(opts);
  const skip = new Set(known.map((r) => `${r.host}:${r.udpPort}`));
  const scanned = await scanLanShtrihUdp({ ...opts, skip });
  return uniqHosts([...known, ...scanned]);
}

module.exports = {
  FACTORY_HOSTS,
  knownHostCandidates,
  probeKnownShtrihHosts,
  scanLanShtrihUdp,
  discoverShtrihUdp,
};

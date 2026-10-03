/**
 * Discover LAN hub by probing /hub/health on the local /24 (port 8787).
 * Works in browser (waiter PWA) without mDNS.
 */

const DEFAULT_PORT = 8787;

async function guessLocalIpv4() {
  if (typeof RTCPeerConnection === 'undefined') return null;
  return new Promise((resolve) => {
    let done = false;
    const finish = (ip) => {
      if (done) return;
      done = true;
      try { pc.close(); } catch { /* ignore */ }
      resolve(ip || null);
    };
    const pc = new RTCPeerConnection({ iceServers: [] });
    try {
      pc.createDataChannel('');
    } catch {
      finish(null);
      return;
    }
    pc.onicecandidate = (e) => {
      if (!e?.candidate?.candidate) {
        if (pc.iceGatheringState === 'complete') finish(null);
        return;
      }
      const m = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
      if (!m) return;
      const ip = m[1];
      if (ip.startsWith('127.') || ip.startsWith('0.')) return;
      finish(ip);
    };
    pc.createOffer()
      .then((o) => pc.setLocalDescription(o))
      .catch(() => finish(null));
    setTimeout(() => finish(null), 1500);
  });
}

function subnetHosts(ipv4) {
  const parts = String(ipv4 || '').split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return [];
  const [a, b, c] = parts;
  const hosts = [];
  for (let d = 1; d <= 254; d += 1) {
    hosts.push(`${a}.${b}.${c}.${d}`);
  }
  return hosts;
}

async function probeHealth(baseUrl, timeoutMs) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => ctrl?.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/hub/health`, {
      signal: ctrl?.signal,
      method: 'GET',
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.ok) return null;
    return {
      url: baseUrl,
      storeId: json.storeId ?? null,
      deviceId: json.deviceId ?? null,
      lanIp: json.lanIp || null,
      port: json.port || DEFAULT_PORT,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {{ port?: number, timeoutMs?: number, concurrency?: number, preferUrl?: string }} [opts]
 * @returns {Promise<object[]>}
 */
export async function discoverLanHubs(opts = {}) {
  const port = Number(opts.port) || DEFAULT_PORT;
  const timeoutMs = Number(opts.timeoutMs) || 350;
  const concurrency = Math.max(4, Number(opts.concurrency) || 24);
  const found = [];
  const seen = new Set();

  const prefer = String(opts.preferUrl || '').replace(/\/$/, '');
  if (prefer) {
    const hit = await probeHealth(prefer, Math.max(timeoutMs, 800));
    if (hit) {
      found.push(hit);
      seen.add(hit.url);
    }
  }

  const localIp = await guessLocalIpv4();
  const hosts = localIp ? subnetHosts(localIp) : [];
  if (!hosts.length && !found.length) return found;

  let idx = 0;
  async function worker() {
    while (idx < hosts.length) {
      const i = idx;
      idx += 1;
      const host = hosts[i];
      const base = `http://${host}:${port}`;
      if (seen.has(base)) continue;
      const hit = await probeHealth(base, timeoutMs);
      if (hit && !seen.has(hit.url)) {
        seen.add(hit.url);
        found.push(hit);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, hosts.length || 1) }, () => worker());
  await Promise.all(workers);
  return found;
}

export { DEFAULT_PORT as HUB_DEFAULT_PORT };

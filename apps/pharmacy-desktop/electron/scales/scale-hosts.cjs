/**
 * Список Ethernet-весов (без Electron) — удобно для тестов и normalize.
 */

function normalizeHostList(cfg = {}) {
  const out = [];
  const seen = new Set();

  const push = (row) => {
    const host = String(row?.host || row?.ip || '').trim();
    if (!host) return;
    const udpPort = Number(row?.udpPort ?? row?.tcpPort ?? row?.port) || 1111;
    const key = `${host}:${udpPort}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      host,
      udpPort,
      label: String(row?.label || row?.name || '').trim(),
    });
  };

  const list = Array.isArray(cfg.scaleHosts) ? cfg.scaleHosts : [];
  for (const row of list) push(row);

  const legacyHost = String(cfg.scaleHost || '').trim();
  if (legacyHost) {
    push({
      host: legacyHost,
      udpPort: Number(cfg.scaleTcpPort) || 1111,
      label: '',
    });
  }

  return out;
}

module.exports = { normalizeHostList };

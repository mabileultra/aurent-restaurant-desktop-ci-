const fs = require('fs');
const path = require('path');

function userConfigPath() {
  // electron только в runtime кассы; тесты используют normalizeHostList без app
  const { app } = require('electron');
  return path.join(app.getPath('userData'), 'config.json');
}

function readUserConfig() {
  try {
    const file = userConfigPath();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch {
    // ignore
  }
  return {};
}

/**
 * Нормализация списка Ethernet-весов.
 * @returns {Array<{host:string,udpPort:number,label:string}>}
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

  // Legacy single host → в список
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

/**
 * @returns {{
 *   transport: 'com'|'ethernet',
 *   port: string,
 *   baudRate: number,
 *   host: string,
 *   tcpPort: number,
 *   hosts: Array<{host:string,udpPort:number,label:string}>,
 *   family: string,
 *   mock: boolean,
 *   stableOnly: boolean,
 * }}
 */
function readScaleSettings() {
  const cfg = readUserConfig();
  const transport = String(cfg.scaleTransport || '').toLowerCase() === 'ethernet'
    ? 'ethernet'
    : 'com';
  const hosts = normalizeHostList(cfg);
  const primary = hosts[0] || null;
  return {
    transport,
    port: String(cfg.scalePort || '').trim(),
    baudRate: Number(cfg.scaleBaudRate || 9600),
    host: String(cfg.scaleHost || primary?.host || '').trim(),
    tcpPort: Number(cfg.scaleTcpPort || primary?.udpPort || 1111) || 1111,
    hosts,
    family: String(cfg.scaleFamily || (transport === 'ethernet' ? 'family-shtrih-print' : 'weight-generic')).trim(),
    mock: cfg.scaleMock === true,
    stableOnly: cfg.scaleStableOnly !== false,
  };
}

function writeScaleSettings(patch) {
  const file = userConfigPath();
  const current = readUserConfig();
  const merged = { ...current };

  if (typeof patch?.scaleTransport === 'string') {
    const t = patch.scaleTransport.toLowerCase() === 'ethernet' ? 'ethernet' : 'com';
    merged.scaleTransport = t;
  }
  if (typeof patch?.scalePort === 'string') merged.scalePort = patch.scalePort.trim();
  if (patch?.scaleBaudRate != null) merged.scaleBaudRate = Number(patch.scaleBaudRate) || 9600;
  if (typeof patch?.scaleHost === 'string') merged.scaleHost = patch.scaleHost.trim();
  if (patch?.scaleTcpPort != null) merged.scaleTcpPort = Number(patch.scaleTcpPort) || 1111;
  if (typeof patch?.scaleFamily === 'string') merged.scaleFamily = patch.scaleFamily.trim();
  if (typeof patch?.scaleMock === 'boolean') merged.scaleMock = patch.scaleMock;
  if (typeof patch?.scaleStableOnly === 'boolean') merged.scaleStableOnly = patch.scaleStableOnly;

  // Полная замена списка весов
  if (Array.isArray(patch?.scaleHosts)) {
    merged.scaleHosts = normalizeHostList({ scaleHosts: patch.scaleHosts });
    if (merged.scaleHosts.length) {
      merged.scaleHost = merged.scaleHosts[0].host;
      merged.scaleTcpPort = merged.scaleHosts[0].udpPort;
      merged.scaleTransport = 'ethernet';
      if (!merged.scaleFamily) merged.scaleFamily = 'family-shtrih-print';
    }
  }

  // Добавить / обновить одну запись в списке
  if (typeof patch?.scaleHost === 'string' && patch.scaleHost.trim()) {
    merged.scaleTransport = 'ethernet';
    if (!merged.scaleFamily) merged.scaleFamily = 'family-shtrih-print';
    const host = patch.scaleHost.trim();
    const udpPort = Number(patch.scaleTcpPort ?? merged.scaleTcpPort) || 1111;
    const label = String(patch.scaleHostLabel || '').trim();
    const existing = normalizeHostList(merged).filter(
      (h) => !(h.host === host && h.udpPort === udpPort)
    );
    existing.unshift({ host, udpPort, label });
    merged.scaleHosts = existing;
    merged.scaleHost = host;
    merged.scaleTcpPort = udpPort;
  }

  if (typeof patch?.scalePort === 'string' && patch.scalePort.trim() && !patch?.scaleHost && !patch?.scaleHosts) {
    if (merged.scaleTransport !== 'ethernet') merged.scaleTransport = 'com';
  }

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(merged, null, 2), 'utf8');
  return readScaleSettings();
}

module.exports = { readScaleSettings, writeScaleSettings, normalizeHostList };

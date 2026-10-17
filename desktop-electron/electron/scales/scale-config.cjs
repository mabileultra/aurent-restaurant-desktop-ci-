const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function userConfigPath() {
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
 * @returns {{
 *   transport: 'com'|'ethernet',
 *   port: string,
 *   baudRate: number,
 *   host: string,
 *   tcpPort: number,
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
  return {
    transport,
    port: String(cfg.scalePort || '').trim(),
    baudRate: Number(cfg.scaleBaudRate || 9600),
    host: String(cfg.scaleHost || '').trim(),
    tcpPort: Number(cfg.scaleTcpPort || 1001) || 1001,
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
  if (patch?.scaleTcpPort != null) merged.scaleTcpPort = Number(patch.scaleTcpPort) || 1001;
  if (typeof patch?.scaleFamily === 'string') merged.scaleFamily = patch.scaleFamily.trim();
  if (typeof patch?.scaleMock === 'boolean') merged.scaleMock = patch.scaleMock;
  if (typeof patch?.scaleStableOnly === 'boolean') merged.scaleStableOnly = patch.scaleStableOnly;

  // Convenience: saving a host implies ethernet; saving a COM path implies com.
  if (typeof patch?.scaleHost === 'string' && patch.scaleHost.trim()) {
    merged.scaleTransport = 'ethernet';
    if (!merged.scaleFamily) merged.scaleFamily = 'family-shtrih-print';
  }
  if (typeof patch?.scalePort === 'string' && patch.scalePort.trim() && !patch?.scaleHost) {
    if (merged.scaleTransport !== 'ethernet') merged.scaleTransport = 'com';
  }

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(merged, null, 2), 'utf8');
  return readScaleSettings();
}

module.exports = { readScaleSettings, writeScaleSettings };

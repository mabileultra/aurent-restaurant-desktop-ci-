const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function configPath() {
  return path.join(app.getPath('userData'), 'lan-hub.json');
}

function readFileFlag() {
  try {
    const p = configPath();
    if (!fs.existsSync(p)) return null;
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (typeof raw?.enabled === 'boolean') return raw.enabled;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Hall PC = Wi‑Fi hub for kitchen/waiter phones (Phase H).
 * Priority: env RESTAURANT_LAN_HUB → userData → default on when packaged.
 */
function resolveLanHubEnabled({ isPackaged = false, env = process.env } = {}) {
  const fromEnv = env.RESTAURANT_LAN_HUB;
  if (fromEnv === '0' || fromEnv === 'false') return false;
  if (fromEnv === '1' || fromEnv === 'true') return true;
  const fromFile = readFileFlag();
  if (fromFile != null) return fromFile;
  return Boolean(isPackaged);
}

function setLanHubEnabled(enabled) {
  try {
    fs.writeFileSync(
      configPath(),
      `${JSON.stringify({ enabled: Boolean(enabled), updatedAt: Date.now() })}\n`,
      'utf8',
    );
  } catch {
    /* best-effort */
  }
  return Boolean(enabled);
}

module.exports = { resolveLanHubEnabled, setLanHubEnabled };

const ENGINE_SQLJS = 'sqljs';
const ENGINE_NATIVE = 'native';

function normalizeOfflineEngine(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (value === ENGINE_NATIVE || value === 'sqlite' || value === 'better-sqlite3') {
    return ENGINE_NATIVE;
  }
  if (value === ENGINE_SQLJS || value === 'sql.js' || value === 'wasm') {
    return ENGINE_SQLJS;
  }
  return '';
}

function resolveOfflineEngine({ userConfig, env = process.env } = {}) {
  const fromEnv = normalizeOfflineEngine(env?.AURENT_OFFLINE_ENGINE);
  if (fromEnv) return fromEnv;
  const fromUser = normalizeOfflineEngine(userConfig?.offlineEngine);
  if (fromUser) return fromUser;
  return ENGINE_SQLJS;
}

module.exports = {
  ENGINE_SQLJS,
  ENGINE_NATIVE,
  normalizeOfflineEngine,
  resolveOfflineEngine,
};

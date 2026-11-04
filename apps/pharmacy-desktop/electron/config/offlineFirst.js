function resolveOfflineFirst({ userConfig, env = process.env } = {}) {
  const fromEnv = String(env?.AURENT_OFFLINE_FIRST || '').trim().toLowerCase();
  if (fromEnv === '1' || fromEnv === 'true' || fromEnv === 'yes') return true;
  if (fromEnv === '0' || fromEnv === 'false' || fromEnv === 'no') return false;
  return userConfig?.offlineFirst === true;
}

module.exports = { resolveOfflineFirst };

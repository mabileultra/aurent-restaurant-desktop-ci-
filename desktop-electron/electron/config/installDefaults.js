/**
 * Дефолты первого запуска. Lab CI: scripts/bake-install-defaults.js
 * пишет installDefaults.baked.js с хостом тестового сервера.
 */
function readInstallDefaults() {
  try {
    // eslint-disable-next-line import/no-unresolved, global-require
    return require('./installDefaults.baked');
  } catch {
    return null;
  }
}

/** Прод Aurent — на lab-сборке нельзя оставлять этот хост (там Multikassa). */
function isProdAurentHost(host) {
  const h = String(host || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .split(':')[0];
  if (!h) return true;
  return h === 'aurent.uz' || h === 'www.aurent.uz' || h.endsWith('.aurent.uz');
}

module.exports = { readInstallDefaults, isProdAurentHost };

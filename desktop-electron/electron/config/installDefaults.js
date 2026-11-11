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

module.exports = { readInstallDefaults };

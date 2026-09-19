const { resolveCashierStartUrl } = require('./resolveCashierStartUrl');
const { startLocalUiServer } = require('./localUiServer');
const { resolveBundledUiRoot } = require('./bundledUiRoot');
const { setActiveUiOrigin } = require('./activeUiOrigin');
const { buildLoginUrl } = require('../config/loginUrl');

function createCashierUiSession({
  loadConfig,
  isPackaged,
  resourcesPath,
  appPath,
  startServer = startLocalUiServer,
} = {}) {
  let localServer = null;
  let lastStart = null;

  async function stopLocal() {
    if (!localServer) return;
    const current = localServer;
    localServer = null;
    try {
      await current.close();
    } catch {
      // ignore
    }
  }

  function applyStart(result) {
    lastStart = result;
    localServer = result.localServer;
    setActiveUiOrigin(result.uiOrigin);
    return result;
  }

  async function ensureStartUrl() {
    const cfg = loadConfig();
    const bundledRoot = resolveBundledUiRoot({
      isPackaged,
      resourcesPath,
      appPath,
    });
    const result = await resolveCashierStartUrl({
      cfg,
      bundledRoot,
      currentServer: localServer,
      startServer,
      stopServer: stopLocal,
    });
    return applyStart(result);
  }

  async function fallbackToRemote() {
    await stopLocal();
    const cfg = loadConfig();
    return applyStart({
      url: buildLoginUrl(cfg),
      source: 'remote-fallback',
      reason: 'load_failed',
      uiOrigin: String(cfg.cashierUrl || '').replace(/\/$/, ''),
      localServer: null,
    });
  }

  function getLastStart() {
    return lastStart;
  }

  return {
    ensureStartUrl,
    fallbackToRemote,
    stopLocal,
    getLastStart,
  };
}

module.exports = { createCashierUiSession };

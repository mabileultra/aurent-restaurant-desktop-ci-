const { buildLoginUrl } = require('../config/loginUrl');
const { resolveUiMode, UI_MODE_BUNDLED } = require('../config/uiMode');

async function resolveCashierStartUrl({
  cfg,
  bundledRoot,
  currentServer = null,
  startServer,
  stopServer,
  env = process.env,
} = {}) {
  const mode = cfg?.uiMode || resolveUiMode({ userConfig: cfg, env });
  const remoteOrigin = String(cfg?.cashierUrl || '').replace(/\/$/, '');
  const remoteUrl = buildLoginUrl(cfg);

  if (mode !== UI_MODE_BUNDLED) {
    if (typeof stopServer === 'function') await stopServer();
    return {
      url: remoteUrl,
      source: 'remote',
      reason: 'default',
      uiOrigin: remoteOrigin,
      localServer: null,
    };
  }

  if (!bundledRoot) {
    if (typeof stopServer === 'function') await stopServer();
    return {
      url: remoteUrl,
      source: 'remote-fallback',
      reason: 'ui_missing',
      uiOrigin: remoteOrigin,
      localServer: null,
    };
  }

  try {
    let server = currentServer;
    const sameServer =
      server
      && server.uiRoot === bundledRoot
      && server.backendOrigin === cfg.backendOrigin;
    if (!sameServer) {
      if (typeof stopServer === 'function') await stopServer();
      server = await startServer({ uiRoot: bundledRoot, backendOrigin: cfg.backendOrigin });
    }
    const uiOrigin = server.origin;
    return {
      url: buildLoginUrl({ ...cfg, cashierUrl: uiOrigin }),
      source: 'bundled',
      reason: 'ok',
      uiOrigin,
      localServer: server,
    };
  } catch (err) {
    if (typeof stopServer === 'function') await stopServer();
    return {
      url: remoteUrl,
      source: 'remote-fallback',
      reason: 'local_server_failed',
      error: String(err?.message || err),
      uiOrigin: remoteOrigin,
      localServer: null,
    };
  }
}

module.exports = { resolveCashierStartUrl };

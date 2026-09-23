const { buildLoginUrl, normalizeAppWorld, APP_WORLD_RESTAURANT, loginUiOrigin } = require('../config/loginUrl');
const { resolveUiMode, UI_MODE_BUNDLED } = require('../config/uiMode');

async function resolveCashierStartUrl({
  cfg,
  bundledRoot,
  currentServer,
  startServer,
  stopServer,
  env = process.env,
} = {}) {
  // Restaurant world always opens r-aurent (or configured restaurantUrl) — no domain hop after login.
  if (normalizeAppWorld(cfg?.appWorld) === APP_WORLD_RESTAURANT) {
    if (typeof stopServer === 'function') await stopServer();
    const remoteOrigin = loginUiOrigin(cfg);
    return {
      url: buildLoginUrl(cfg),
      source: 'remote',
      reason: 'restaurant_world',
      uiOrigin: remoteOrigin,
      localServer: null,
    };
  }

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

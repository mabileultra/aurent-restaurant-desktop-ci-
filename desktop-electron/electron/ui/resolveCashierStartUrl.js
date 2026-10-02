const { buildLoginUrl, normalizeAppWorld, APP_WORLD_RESTAURANT, loginUiOrigin } = require('../config/loginUrl');
const { resolveUiMode, UI_MODE_BUNDLED } = require('../config/uiMode');
const { resolveRestaurantLocalFirst } = require('../config/restaurantLocalFirst');

function wantsBundledRestaurantUi(cfg, env) {
  if (normalizeAppWorld(cfg?.appWorld) !== APP_WORLD_RESTAURANT) return false;
  // Dark default: remote r-aurent. Only restaurantLocalFirst (config/env) opts into bundled UI.
  return resolveRestaurantLocalFirst({ userConfig: cfg, env });
}

async function resolveCashierStartUrl({
  cfg,
  bundledRoot,
  currentServer,
  startServer,
  stopServer,
  env = process.env,
} = {}) {
  const isRestaurant = normalizeAppWorld(cfg?.appWorld) === APP_WORLD_RESTAURANT;

  // Restaurant default stays remote (r-aurent). Bundled only when local-first or uiMode=bundled.
  if (isRestaurant && !wantsBundledRestaurantUi(cfg, env)) {
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
  const remoteOrigin = isRestaurant
    ? loginUiOrigin(cfg)
    : String(cfg?.cashierUrl || '').replace(/\/$/, '');
  const remoteUrl = buildLoginUrl(cfg);
  const preferBundled = isRestaurant
    ? wantsBundledRestaurantUi(cfg, env)
    : mode === UI_MODE_BUNDLED;

  if (!preferBundled) {
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
    const loginCfg = isRestaurant
      ? { ...cfg, restaurantUrl: uiOrigin }
      : { ...cfg, cashierUrl: uiOrigin };
    return {
      url: buildLoginUrl(loginCfg),
      source: 'bundled',
      reason: isRestaurant ? 'restaurant_local_first' : 'ok',
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

module.exports = { resolveCashierStartUrl, wantsBundledRestaurantUi };

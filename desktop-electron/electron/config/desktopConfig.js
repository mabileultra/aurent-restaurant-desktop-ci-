const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { buildOrigin, buildHealthUrl, parseServerUrl } = require('../core/serverUrl');
const { resolveDesktopUrls, PRODUCTION_RESTAURANT_ORIGIN } = require('../../config/desktopUrls');
const { resolveUiMode, UI_MODE_REMOTE, UI_MODE_BUNDLED } = require('./uiMode');
const { resolveOfflineFirst } = require('./offlineFirst');
const { resolveRestaurantLocalFirst } = require('./restaurantLocalFirst');
const {
  buildLoginUrl,
  normalizeCompanyLoginCode,
  normalizeAppWorld,
  APP_WORLD_MAIN,
  APP_WORLD_RESTAURANT,
} = require('./loginUrl');

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
    // ignore invalid config
  }
  return null;
}

function writeUserConfig(patch) {
  const current = readUserConfig() || {};
  const merged = { ...current, ...(patch || {}) };
  fs.mkdirSync(path.dirname(userConfigPath()), { recursive: true });
  fs.writeFileSync(userConfigPath(), JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

function hasUserConfig() {
  try {
    return fs.existsSync(userConfigPath());
  } catch {
    return false;
  }
}

function loadDesktopConfig({ isPackaged }) {
  const envUrls = resolveDesktopUrls({ isPackaged });
  const user = readUserConfig() || {};
  const envWeb = process.env.AURENT_WEB_URL || process.env.VITE_DEV_URL || '';
  const envApi = process.env.AURENT_API_URL || '';

  let backendOrigin = user.backendOrigin || '';
  if (!backendOrigin && envApi) {
    backendOrigin = envApi.replace(/\/api\/v1\/?$/, '');
  }
  if (!backendOrigin) {
    backendOrigin = parseServerUrl(envUrls.webUrl.replace(/\/cashier\/login\/?$/, '')).origin
      || parseServerUrl(envUrls.apiUrl.replace(/\/api\/v1\/?$/, '')).origin;
  }
  backendOrigin = String(backendOrigin).replace(/\/$/, '');

  let cashierUrl = user.cashierUrl || '';
  if (!cashierUrl && envWeb) {
    cashierUrl = envWeb.replace(/\/cashier\/login\/?$/, '');
  }
  if (!cashierUrl) {
    cashierUrl = backendOrigin;
  }
  cashierUrl = String(cashierUrl).replace(/\/$/, '');

  const apiUrl = `${backendOrigin}/api/v1`;
  const uiMode = resolveUiMode({ userConfig: user });

  let restaurantUrl = String(user.restaurantUrl || envUrls.restaurantUrl || '').trim();
  restaurantUrl = restaurantUrl.replace(/\/$/, '');
  if (!restaurantUrl) {
    restaurantUrl = PRODUCTION_RESTAURANT_ORIGIN;
  }

  const appWorld = normalizeAppWorld(
    process.env.AURENT_APP_WORLD || user.appWorld || APP_WORLD_MAIN
  );

  const stationPrinters = (user.stationPrinters && typeof user.stationPrinters === 'object'
    && !Array.isArray(user.stationPrinters))
    ? user.stationPrinters
    : {};

  return {
    cashierUrl,
    restaurantUrl,
    appWorld,
    backendOrigin,
    apiUrl,
    apiHealthUrl: user.apiHealthUrl || buildHealthUrl(backendOrigin),
    webPort: String(user.webPort || parseServerUrl(cashierUrl).port || '443'),
    apiPort: String(user.apiPort || parseServerUrl(backendOrigin).port || '443'),
    companyLoginCode: String(user.companyLoginCode || process.env.AURENT_COMPANY_CODE || '').trim(),
    uiMode,
    offlineFirst: resolveOfflineFirst({ userConfig: user }),
    restaurantLocalFirst: resolveRestaurantLocalFirst({ userConfig: user }),
    allowBundledUi: user.allowBundledUi === true || process.env.AURENT_UI_DEV === '1',
    // Kitchen/hub print — were omitted, so waiter SEND never saw Windows printer names.
    receiptPrinterName: String(user.receiptPrinterName || '').trim(),
    labelPrinterName: String(user.labelPrinterName || '').trim(),
    billPrinterName: String(user.billPrinterName || '').trim(),
    stationPrinters,
  };
}

function saveOfflineFirst(enabled) {
  return writeUserConfig({
    offlineFirst: Boolean(enabled),
  });
}

function saveRestaurantLocalFirst(enabled) {
  const on = Boolean(enabled);
  return writeUserConfig({
    restaurantLocalFirst: on,
    // Local-first restaurant needs bundled UI files on disk.
    ...(on ? { uiMode: UI_MODE_BUNDLED, useRemoteUi: false } : {}),
  });
}

function saveUiMode(mode) {
  const uiMode = resolveUiMode({ userConfig: { uiMode: mode }, env: {} }) || UI_MODE_REMOTE;
  return writeUserConfig({
    uiMode,
    useRemoteUi: uiMode !== UI_MODE_BUNDLED,
  });
}

function saveServerConfig({ host, webPort, apiPort, companyLoginCode, appWorld, restaurantUrl }) {
  const code = normalizeCompanyLoginCode(companyLoginCode);
  if (!code) {
    throw new Error('Код компании: 5 цифр, от 10000 до 99999');
  }

  let h = String(host || '').trim().replace(/^https?:\/\//, '').split('/')[0];
  if (h.includes(':')) {
    h = h.split(':')[0];
  }

  const web = String(webPort || '443').trim() || '443';
  const api = String(apiPort || web).trim() || web;
  const webOrigin = buildOrigin(h, web);
  const apiOrigin = buildOrigin(h, api);

  const current = readUserConfig() || {};
  const uiMode = resolveUiMode({ userConfig: current });
  const world = normalizeAppWorld(appWorld || current.appWorld || APP_WORLD_MAIN);
  const envUrls = resolveDesktopUrls({ isPackaged: app.isPackaged });
  const rstUrl = String(restaurantUrl || current.restaurantUrl || envUrls.restaurantUrl || PRODUCTION_RESTAURANT_ORIGIN)
    .trim()
    .replace(/\/$/, '');

  return writeUserConfig({
    useRemoteUi: uiMode !== UI_MODE_BUNDLED,
    uiMode,
    cashierUrl: webOrigin,
    restaurantUrl: rstUrl,
    appWorld: world,
    backendOrigin: apiOrigin,
    webPort: web,
    apiPort: api,
    apiHealthUrl: buildHealthUrl(apiOrigin),
    companyLoginCode: code,
  });
}

function configFromUserFile() {
  const user = readUserConfig();
  if (!user) return null;
  return loadDesktopConfig({ isPackaged: app.isPackaged });
}

module.exports = {
  userConfigPath,
  readUserConfig,
  writeUserConfig,
  hasUserConfig,
  loadDesktopConfig,
  buildLoginUrl,
  saveServerConfig,
  saveUiMode,
  saveOfflineFirst,
  saveRestaurantLocalFirst,
  normalizeCompanyLoginCode,
  normalizeAppWorld,
  configFromUserFile,
  APP_WORLD_MAIN,
  APP_WORLD_RESTAURANT,
};

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { buildOrigin, buildHealthUrl, parseServerUrl } = require('../core/serverUrl');
const { resolveDesktopUrls } = require('../../config/desktopUrls');

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

function normalizeCompanyLoginCode(raw) {
  const digits = String(raw || '').trim().replace(/\D/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 10000 || n > 99999) return '';
  return String(n).padStart(5, '0');
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

  return {
    cashierUrl,
    backendOrigin,
    apiUrl,
    apiHealthUrl: user.apiHealthUrl || buildHealthUrl(backendOrigin),
    webPort: String(user.webPort || parseServerUrl(cashierUrl).port || '443'),
    apiPort: String(user.apiPort || parseServerUrl(backendOrigin).port || '443'),
    companyLoginCode: String(user.companyLoginCode || process.env.AURENT_COMPANY_CODE || '').trim(),
  };
}

function buildLoginUrl(cfg) {
  const base = `${String(cfg.cashierUrl || '').replace(/\/$/, '')}/cashier/login`;
  const code = normalizeCompanyLoginCode(cfg.companyLoginCode);
  if (!code) return base;
  return `${base}?${new URLSearchParams({ companyLoginCode: code })}`;
}

function saveServerConfig({ host, webPort, apiPort, companyLoginCode }) {
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

  return writeUserConfig({
    useRemoteUi: true,
    cashierUrl: webOrigin,
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
  normalizeCompanyLoginCode,
  configFromUserFile,
};

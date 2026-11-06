const { buildLoginUrl } = require('../config/loginUrl');
const { cashierUrlForUi } = require('../ui/activeUiOrigin');

const PUBLIC_PATHS = new Set(['/', '/about', '/pricing', '/equipment', '/contacts', '/install']);

function isPublicLandingPath(pathname) {
  const p = String(pathname || '/').replace(/\/$/, '') || '/';
  return PUBLIC_PATHS.has(p === '' ? '/' : p.startsWith('/') ? p : `/${p}`);
}

function originOf(urlLike) {
  try {
    return new URL(urlLike).origin;
  } catch {
    return '';
  }
}

/** Only bounce marketing pages on the main (aurent) origin — not restaurant SPA. */
function shouldRedirectToCashierLogin(url, cfg) {
  try {
    const u = new URL(url);
    if (u.protocol === 'data:' || u.protocol === 'file:') return false;
    if (!isPublicLandingPath(u.pathname)) return false;

    const mainOrigin = originOf(cashierUrlForUi(cfg) || cfg?.cashierUrl);
    if (mainOrigin && u.origin !== mainOrigin) return false;

    const restaurantOrigin = originOf(cfg?.restaurantUrl);
    if (restaurantOrigin && u.origin === restaurantOrigin) return false;

    return true;
  } catch {
    return false;
  }
}

function redirectToCashierLogin(webContents, cfg) {
  const target = buildLoginUrl({ ...cfg, cashierUrl: cashierUrlForUi(cfg) });
  if (webContents.getURL() === target) return;
  webContents.loadURL(target);
}

function attachDesktopNavigationGuard(mainWindow, getConfig) {
  const guard = (webContents) => {
    if (!webContents || webContents.isDestroyed()) return;
    const cfg = typeof getConfig === 'function' ? getConfig() : getConfig;
    if (shouldRedirectToCashierLogin(webContents.getURL(), cfg)) {
      redirectToCashierLogin(webContents, cfg);
    }
  };

  mainWindow.webContents.on('did-finish-load', () => guard(mainWindow.webContents));
  mainWindow.webContents.on('did-navigate-in-page', () => guard(mainWindow.webContents));
  mainWindow.webContents.on('did-navigate', () => guard(mainWindow.webContents));
}

module.exports = {
  attachDesktopNavigationGuard,
  isPublicLandingPath,
  shouldRedirectToCashierLogin,
};

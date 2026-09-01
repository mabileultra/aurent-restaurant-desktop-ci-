const { buildLoginUrl } = require('../config/desktopConfig');

const PUBLIC_PATHS = new Set(['/', '/about', '/pricing', '/equipment', '/contacts', '/install']);

function isPublicLandingPath(pathname) {
  const p = String(pathname || '/').replace(/\/$/, '') || '/';
  return PUBLIC_PATHS.has(p === '' ? '/' : p.startsWith('/') ? p : `/${p}`);
}

function shouldRedirectToCashierLogin(url, cfg) {
  try {
    const u = new URL(url);
    if (u.protocol === 'data:' || u.protocol === 'file:') return false;
    return isPublicLandingPath(u.pathname);
  } catch {
    return false;
  }
}

function redirectToCashierLogin(webContents, cfg) {
  const target = buildLoginUrl(cfg);
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

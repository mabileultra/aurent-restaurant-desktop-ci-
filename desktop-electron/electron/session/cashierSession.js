const { app } = require('electron');
const { hasUserConfig, loadDesktopConfig, buildLoginUrl } = require('../config/desktopConfig');
const { cashierUrlForUi } = require('../ui/activeUiOrigin');
const { showSetupWindow } = require('../setup/setupWindow');
const { showServerSetupPasswordWindow } = require('../setup/passwordWindow');

async function clearCashierWebStorage(mainWindow, cfg) {
  if (!mainWindow || mainWindow.isDestroyed() || !cfg?.cashierUrl) return;
  const origins = new Set(
    [cfg.cashierUrl, cashierUrlForUi(cfg), cfg.restaurantUrl].filter(Boolean).map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return '';
      }
    }).filter(Boolean),
  );
  for (const origin of origins) {
    try {
      await mainWindow.webContents.session.clearStorageData({
        origin,
        storages: ['localstorage'],
      });
    } catch {
      // ignore invalid origin
    }
  }
}

async function reloadCashierLogin(mainWindow, cfg, { clearSession = false, loginUrl } = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (clearSession) {
    await clearCashierWebStorage(mainWindow, cfg);
  }
  await mainWindow.loadURL(loginUrl || buildLoginUrl(cfg));
}

async function configureServerInteractive(existingConfig) {
  return showSetupWindow(existingConfig);
}

async function openServerSettings({ mainWindow, onConfigSaved, resolveLoginUrl }) {
  let config = loadDesktopConfig({ isPackaged: app.isPackaged });
  if (hasUserConfig()) {
    await showServerSetupPasswordWindow(config);
  }
  await configureServerInteractive(config);
  config = loadDesktopConfig({ isPackaged: app.isPackaged });
  if (typeof onConfigSaved === 'function') {
    onConfigSaved(config);
  }
  const resolved = typeof resolveLoginUrl === 'function' ? await resolveLoginUrl() : null;
  await reloadCashierLogin(mainWindow, config, {
    clearSession: true,
    loginUrl: resolved?.url,
  });
  return config;
}

async function ensureInitialServerConfig() {
  if (hasUserConfig()) return true;
  if (process.env.AURENT_WEB_URL || process.env.AURENT_API_URL) return true;
  try {
    const config = loadDesktopConfig({ isPackaged: app.isPackaged });
    await showSetupWindow(config);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  buildLoginUrl,
  hasUserConfig,
  configureServerInteractive,
  reloadCashierLogin,
  openServerSettings,
  ensureInitialServerConfig,
};

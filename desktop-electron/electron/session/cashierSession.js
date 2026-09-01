const { app } = require('electron');
const { hasUserConfig, loadDesktopConfig, buildLoginUrl } = require('../config/desktopConfig');
const { showSetupWindow } = require('../setup/setupWindow');
const { showServerSetupPasswordWindow } = require('../setup/passwordWindow');

async function clearCashierWebStorage(mainWindow, cfg) {
  if (!mainWindow || mainWindow.isDestroyed() || !cfg?.cashierUrl) return;
  try {
    const origin = new URL(cfg.cashierUrl).origin;
    await mainWindow.webContents.session.clearStorageData({
      origin,
      storages: ['localstorage'],
    });
  } catch {
    // ignore invalid origin
  }
}

async function reloadCashierLogin(mainWindow, cfg, { clearSession = false } = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (clearSession) {
    await clearCashierWebStorage(mainWindow, cfg);
  }
  await mainWindow.loadURL(buildLoginUrl(cfg));
}

async function configureServerInteractive(existingConfig) {
  return showSetupWindow(existingConfig);
}

async function openServerSettings({ mainWindow, onConfigSaved }) {
  let config = loadDesktopConfig({ isPackaged: app.isPackaged });
  if (hasUserConfig()) {
    await showServerSetupPasswordWindow(config);
  }
  await configureServerInteractive(config);
  config = loadDesktopConfig({ isPackaged: app.isPackaged });
  if (typeof onConfigSaved === 'function') {
    onConfigSaved(config);
  }
  await reloadCashierLogin(mainWindow, config, { clearSession: true });
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

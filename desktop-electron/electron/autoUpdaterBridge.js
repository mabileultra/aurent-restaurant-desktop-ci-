/**
 * Автообновление Electron через electron-updater (generic feed на /downloads/desktop/).
 */
const { app, ipcMain, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const { DESKTOP_UPDATE_FEED } = require('../config/publicUrl');

let feedUrl = null;

function resolveFeedUrl(webUrl) {
  if (process.env.AURENT_UPDATE_URL) {
    const url = process.env.AURENT_UPDATE_URL.trim();
    return url.endsWith('/') ? url : `${url}/`;
  }
  if (!webUrl) return DESKTOP_UPDATE_FEED;
  try {
    const origin = new URL(webUrl).origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return DESKTOP_UPDATE_FEED;
    }
    return `${origin}/downloads/desktop/`;
  } catch {
    return DESKTOP_UPDATE_FEED;
  }
}

function broadcastUpdate(payload) {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('desktop:update', payload);
    }
  });
}

function isUpdaterEnabled() {
  return app.isPackaged && Boolean(feedUrl);
}

function registerAutoUpdaterHandlers() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    broadcastUpdate({ type: 'available', version: info.version });
  });

  autoUpdater.on('download-progress', (progress) => {
    broadcastUpdate({
      type: 'progress',
      percent: Math.round(progress.percent || 0),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    broadcastUpdate({ type: 'downloaded', version: info.version });
  });

  autoUpdater.on('error', (error) => {
    broadcastUpdate({ type: 'error', message: error?.message || String(error) });
  });
}

function scheduleBackgroundChecks() {
  if (!isUpdaterEnabled()) return;

  const check = () => {
    autoUpdater.checkForUpdates().catch(() => {});
  };

  setTimeout(check, 20_000);
  setInterval(check, 4 * 60 * 60 * 1000);
}

function checkForUpdatesNow() {
  if (!app.isPackaged) {
    return Promise.resolve({ ok: true, updateAvailable: false, reason: 'dev' });
  }
  if (!isUpdaterEnabled()) {
    return Promise.resolve({ ok: false, error: 'update_feed_unconfigured' });
  }

  return autoUpdater
    .checkForUpdates()
    .then((result) => {
      const remoteVersion = result?.updateInfo?.version;
      const currentVersion = app.getVersion();
      const updateAvailable = Boolean(remoteVersion && remoteVersion !== currentVersion);
      return {
        ok: true,
        updateAvailable,
        version: remoteVersion || currentVersion,
        currentVersion,
      };
    })
    .catch((error) => ({ ok: false, error: error?.message || String(error) }));
}

function registerAutoUpdaterIpc() {
  ipcMain.handle('desktop:checkForUpdates', () => checkForUpdatesNow());

  ipcMain.handle('desktop:quitAndInstallUpdate', () => {
    if (!isUpdaterEnabled()) return false;
    autoUpdater.quitAndInstall(false, true);
    return true;
  });
}

function initAutoUpdater({ webUrl }) {
  feedUrl = resolveFeedUrl(webUrl);

  registerAutoUpdaterHandlers();
  registerAutoUpdaterIpc();

  if (!isUpdaterEnabled()) {
    return;
  }

  autoUpdater.setFeedURL({
    provider: 'generic',
    url: feedUrl,
  });

  scheduleBackgroundChecks();
}

module.exports = { initAutoUpdater, isUpdaterEnabled, checkForUpdatesNow };

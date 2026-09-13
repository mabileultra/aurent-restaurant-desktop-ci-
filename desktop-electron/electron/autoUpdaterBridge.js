/**
 * Автообновление Electron через electron-updater (generic feed на /downloads/desktop/).
 *
 * Сборки сейчас без Apple/Windows code-signing (нет CSC_* в CI).
 * Без отключения verifyUpdateCodeSignature Mac часто скачивает zip и падает
 * с ошибкой подписи; Windows иногда тоже валидирует publisherName.
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

function classifyUpdaterError(message) {
  const text = String(message || '').toLowerCase();
  if (text.includes('code signature') || text.includes('publisher name') || text.includes('publishername')) {
    return 'signature';
  }
  if (
    text.includes('net::')
    || text.includes('enotfound')
    || text.includes('econn')
    || text.includes('timed out')
    || text.includes('offline')
  ) {
    return 'network';
  }
  return 'generic';
}

function isBenignUpdaterError(message) {
  return classifyUpdaterError(message) === 'signature';
}

function isUpdaterEnabled() {
  return app.isPackaged && Boolean(feedUrl);
}

function configureUpdaterForUnsignedBuilds() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  // Полный файл надёжнее blockmap на нестабильной сети / CDN.
  autoUpdater.disableDifferentialDownload = true;
  // Unsigned CI builds — иначе после скачивания часто «code signature» / publisher mismatch.
  autoUpdater.verifyUpdateCodeSignature = false;
}

function registerAutoUpdaterHandlers() {
  configureUpdaterForUnsignedBuilds();

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
    const message = error?.message || String(error);
    console.error('[autoUpdater]', message);
    if (isBenignUpdaterError(message)) {
      return;
    }
    broadcastUpdate({ type: 'error', code: classifyUpdaterError(message) });
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
    .catch((error) => {
      const message = error?.message || String(error);
      if (isBenignUpdaterError(message)) {
        return { ok: true, updateAvailable: false, reason: 'signature' };
      }
      return { ok: false, error: classifyUpdaterError(message) };
    });
}

function registerAutoUpdaterIpc() {
  ipcMain.handle('desktop:checkForUpdates', () => checkForUpdatesNow());

  ipcMain.handle('desktop:quitAndInstallUpdate', () => {
    if (!isUpdaterEnabled()) return false;
    try {
      // isSilent=false → показать UI установщика при необходимости прав
      autoUpdater.quitAndInstall(false, true);
      return true;
    } catch (error) {
      broadcastUpdate({ type: 'error', code: classifyUpdaterError(error?.message || String(error)) });
      return false;
    }
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

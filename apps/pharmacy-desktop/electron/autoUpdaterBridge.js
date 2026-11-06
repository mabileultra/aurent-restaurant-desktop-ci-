/**
 * Автообновление Electron через electron-updater (generic feed на /downloads/desktop/).
 *
 * Сборки сейчас без Apple/Windows code-signing (нет CSC_* в CI).
 * Без отключения verifyUpdateCodeSignature Mac часто скачивает zip и падает
 * с ошибкой подписи; Windows иногда тоже валидирует publisherName.
 */
const { app, ipcMain, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const { resolveFeedUrl } = require('./autoUpdaterFeed.cjs');

let feedUrl = null;
/** True after update-available until downloaded or hard error — do not swallow mid-cycle errors. */
let downloadCycle = false;
/** Prevents macOS activate from recreating a window while quitAndInstall runs. */
let quittingForUpdate = false;

function isQuittingForUpdate() {
  return quittingForUpdate;
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
    || text.includes('404')
    || text.includes('403')
  ) {
    return 'network';
  }
  return 'generic';
}

function isBenignUpdaterError(message) {
  return classifyUpdaterError(message) === 'signature';
}

function isAlreadyDownloadingError(message) {
  return /already.*(download|downloaded)|download.*(in progress|progress)/i.test(String(message || ''));
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

function startDownload(version) {
  // Immediately move UI off «начинается…» even before first byte.
  broadcastUpdate({ type: 'progress', percent: 0, version: version || null });
  return autoUpdater.downloadUpdate().catch((error) => {
    const message = error?.message || String(error);
    if (isAlreadyDownloadingError(message)) {
      return;
    }
    console.error('[autoUpdater] downloadUpdate', message);
    downloadCycle = false;
    broadcastUpdate({ type: 'error', code: classifyUpdaterError(message) });
  });
}

function registerAutoUpdaterHandlers() {
  configureUpdaterForUnsignedBuilds();

  autoUpdater.on('update-available', (info) => {
    downloadCycle = true;
    const version = info?.version || null;
    broadcastUpdate({ type: 'available', version });
    startDownload(version);
  });

  autoUpdater.on('download-progress', (progress) => {
    downloadCycle = true;
    broadcastUpdate({
      type: 'progress',
      percent: Math.round(progress.percent || 0),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    downloadCycle = false;
    broadcastUpdate({ type: 'downloaded', version: info.version });
  });

  autoUpdater.on('error', (error) => {
    const message = error?.message || String(error);
    console.error('[autoUpdater]', message);
    // Idle signature noise (unsigned builds) — ignore.
    // Mid-download / mid-cycle — always surface, otherwise UI freezes on «Загрузка начинается…».
    if (!downloadCycle && isBenignUpdaterError(message)) {
      return;
    }
    downloadCycle = false;
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
      if (!downloadCycle && isBenignUpdaterError(message)) {
        return { ok: true, updateAvailable: false, reason: 'signature' };
      }
      return { ok: false, error: classifyUpdaterError(message) };
    });
}

function registerAutoUpdaterIpc() {
  ipcMain.handle('desktop:checkForUpdates', () => checkForUpdatesNow());

  ipcMain.handle('desktop:quitAndInstallUpdate', () => {
    if (!isUpdaterEnabled()) return { ok: false, reason: 'disabled' };
    // Do not call quitAndInstall synchronously inside invoke — macOS often no-ops
    // while the IPC reply is still in flight. Close windows, defer install, then
    // force relaunch if the process is still alive (unsigned builds / stalled updater).
    quittingForUpdate = true;
    setTimeout(() => {
      try {
        for (const win of BrowserWindow.getAllWindows()) {
          if (!win.isDestroyed()) {
            try { win.removeAllListeners('close'); } catch { /* ignore */ }
            win.close();
          }
        }
      } catch {
        /* ignore */
      }
      try {
        autoUpdater.quitAndInstall(false, true);
      } catch (error) {
        console.error('[autoUpdater] quitAndInstall', error?.message || error);
        broadcastUpdate({ type: 'error', code: classifyUpdaterError(error?.message || String(error)) });
      }
      setTimeout(() => {
        if (!quittingForUpdate) return;
        console.warn('[autoUpdater] quitAndInstall did not exit — force relaunch');
        try {
          app.relaunch();
        } catch {
          /* ignore */
        }
        app.exit(0);
      }, 4_000);
    }, 250);
    return { ok: true };
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

module.exports = { initAutoUpdater, isUpdaterEnabled, checkForUpdatesNow, isQuittingForUpdate };

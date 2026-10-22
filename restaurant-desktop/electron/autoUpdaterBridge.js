const { app, ipcMain, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const { resolveFeedUrl } = require('./autoUpdaterFeed.cjs');

let feedUrl = null;
let downloadCycle = false;
let quittingForUpdate = false;

function isQuittingForUpdate() {
  return quittingForUpdate;
}

function broadcastUpdate(payload) {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) win.webContents.send('desktop:update', payload);
  });
}

function classifyUpdaterError(message) {
  const text = String(message || '').toLowerCase();
  if (text.includes('code signature') || text.includes('publisher name')) return 'signature';
  if (
    text.includes('net::')
    || text.includes('enotfound')
    || text.includes('econn')
    || text.includes('timed out')
    || text.includes('offline')
    || text.includes('404')
    || text.includes('403')
  ) return 'network';
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
  autoUpdater.disableDifferentialDownload = true;
  autoUpdater.verifyUpdateCodeSignature = false;
}

function startDownload(version) {
  broadcastUpdate({ type: 'progress', percent: 0, version: version || null });
  return autoUpdater.downloadUpdate().catch((error) => {
    const message = error?.message || String(error);
    if (isAlreadyDownloadingError(message)) return;
    downloadCycle = false;
    broadcastUpdate({ type: 'error', code: classifyUpdaterError(message) });
  });
}

function registerAutoUpdaterHandlers() {
  configureUpdaterForUnsignedBuilds();
  autoUpdater.on('update-available', (info) => {
    downloadCycle = true;
    broadcastUpdate({ type: 'available', version: info?.version || null });
    startDownload(info?.version);
  });
  autoUpdater.on('download-progress', (progress) => {
    broadcastUpdate({
      type: 'progress',
      percent: Number(progress?.percent) || 0,
      version: progress?.version || null,
    });
  });
  autoUpdater.on('update-downloaded', (info) => {
    downloadCycle = false;
    broadcastUpdate({ type: 'downloaded', version: info?.version || null });
  });
  autoUpdater.on('error', (error) => {
    const message = error?.message || String(error);
    if (!downloadCycle && isBenignUpdaterError(message)) return;
    downloadCycle = false;
    broadcastUpdate({ type: 'error', code: classifyUpdaterError(message) });
  });
}

function checkForUpdatesNow() {
  if (!app.isPackaged) {
    return Promise.resolve({ ok: true, updateAvailable: false, reason: 'dev' });
  }
  if (!isUpdaterEnabled()) {
    return Promise.resolve({ ok: false, error: 'update_feed_unconfigured' });
  }
  return autoUpdater.checkForUpdates()
    .then((result) => {
      const remoteVersion = result?.updateInfo?.version;
      const currentVersion = app.getVersion();
      return {
        ok: true,
        updateAvailable: Boolean(remoteVersion && remoteVersion !== currentVersion),
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
    quittingForUpdate = true;
    setTimeout(() => {
      try {
        for (const win of BrowserWindow.getAllWindows()) {
          if (!win.isDestroyed()) win.close();
        }
      } catch { /* ignore */ }
      try {
        autoUpdater.quitAndInstall(false, true);
      } catch (error) {
        broadcastUpdate({ type: 'error', code: classifyUpdaterError(error?.message || String(error)) });
      }
      setTimeout(() => {
        if (!quittingForUpdate) return;
        try { app.relaunch(); } catch { /* ignore */ }
        app.exit(0);
      }, 4_000);
    }, 250);
    return { ok: true };
  });
}

function initAutoUpdater() {
  feedUrl = resolveFeedUrl();
  registerAutoUpdaterHandlers();
  registerAutoUpdaterIpc();
  if (!isUpdaterEnabled()) return;
  autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl });
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 20_000);
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 4 * 60 * 60 * 1000);
}

module.exports = { initAutoUpdater, isUpdaterEnabled, checkForUpdatesNow, isQuittingForUpdate };

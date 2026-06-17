const UPDATE_CHANNEL = 'desktop:update-event';

function sendUpdateEvent(getMainWindow, payload) {
  const win = getMainWindow?.();
  if (!win || win.isDestroyed()) {
    return;
  }
  win.webContents.send(UPDATE_CHANNEL, payload);
}

function registerAutoUpdaterEvents(autoUpdater, getMainWindow) {
  autoUpdater.on('checking-for-update', () => {
    sendUpdateEvent(getMainWindow, { type: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    sendUpdateEvent(getMainWindow, {
      type: 'available',
      version: info?.version || null,
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    sendUpdateEvent(getMainWindow, {
      type: 'not-available',
      version: info?.version || null,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateEvent(getMainWindow, {
      type: 'progress',
      percent: Math.round(progress?.percent || 0),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateEvent(getMainWindow, {
      type: 'downloaded',
      version: info?.version || null,
    });
  });

  autoUpdater.on('error', (err) => {
    sendUpdateEvent(getMainWindow, {
      type: 'error',
      message: err?.message || String(err),
    });
  });
}

module.exports = {
  UPDATE_CHANNEL,
  registerAutoUpdaterEvents,
};

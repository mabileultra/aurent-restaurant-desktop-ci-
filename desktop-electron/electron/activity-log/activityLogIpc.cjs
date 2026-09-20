const { ipcMain, shell, BrowserWindow } = require('electron');
const path = require('path');
const {
  appendActivityLog,
  listActivityLogFiles,
  readActivityLogFile,
  logsRootDir,
  ensureLogsDir,
  todayTxtPath,
} = require('./activityLogStore.cjs');

let viewerWindow = null;

function registerActivityLogIpc() {
  ipcMain.handle('activity-log:append', (_e, payload) => {
    try {
      return { ok: true, entry: appendActivityLog(payload || {}) };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('activity-log:list', () => {
    try {
      return { ok: true, dir: logsRootDir(), files: listActivityLogFiles() };
    } catch (err) {
      return { ok: false, error: err?.message || String(err), files: [] };
    }
  });

  ipcMain.handle('activity-log:read', (_e, filePath) => {
    try {
      return { ok: true, ...readActivityLogFile(filePath) };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('activity-log:open-folder', async () => {
    ensureLogsDir();
    const err = await shell.openPath(logsRootDir());
    return { ok: !err, error: err || null, dir: logsRootDir() };
  });

  ipcMain.handle('activity-log:open-file', async (_e, filePath) => {
    try {
      const root = require('./activityLogStore.cjs').logsRootDir();
      const pathMod = require('path');
      const fs = require('fs');
      const resolved = pathMod.resolve(String(filePath || ''));
      if (!resolved.startsWith(pathMod.resolve(root) + pathMod.sep)) {
        throw new Error('log_path_outside_dir');
      }
      if (!fs.existsSync(resolved)) throw new Error('log_not_found');
      const err = await shell.openPath(resolved);
      return { ok: !err, error: err || null, path: resolved };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('activity-log:today-path', () => ({
    ok: true,
    path: todayTxtPath(),
    dir: logsRootDir(),
  }));

  ipcMain.handle('activity-log:open-viewer', () => {
    const { BrowserWindow } = require('electron');
    const parent = BrowserWindow.getFocusedWindow();
    openActivityLogViewer(parent);
    return { ok: true };
  });
}

function openActivityLogViewer(parentWindow) {
  ensureLogsDir();
  if (viewerWindow && !viewerWindow.isDestroyed()) {
    viewerWindow.focus();
    viewerWindow.webContents.send('activity-log:refresh');
    return viewerWindow;
  }

  viewerWindow = new BrowserWindow({
    width: 920,
    height: 640,
    minWidth: 640,
    minHeight: 420,
    title: 'Aurent — журнал',
    parent: parentWindow && !parentWindow.isDestroyed() ? parentWindow : undefined,
    modal: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'activityLogPreload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  viewerWindow.on('closed', () => {
    viewerWindow = null;
  });

  viewerWindow.loadFile(path.join(__dirname, 'viewer', 'index.html'));
  return viewerWindow;
}

module.exports = {
  registerActivityLogIpc,
  openActivityLogViewer,
  appendActivityLog,
};

/**
 * Aurent Cashier — Electron main process
 * Окно 1024×768+, zoomFactor 1, зелёная иконка.
 */
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { showOnScreenKeyboard } = require('./onScreenKeyboard');
const { initAutoUpdater } = require('./autoUpdaterBridge');

const WEB_URL = process.env.AURENT_WEB_URL || process.env.VITE_DEV_URL || 'http://localhost:5173';
const API_URL = process.env.AURENT_API_URL || 'http://localhost:8080/api/v1';
const ICON_PNG = path.join(__dirname, '../build/icon.png');

let mainWindow = null;

function resolveIcon() {
  if (fs.existsSync(ICON_PNG)) return ICON_PNG;
  return undefined;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    autoHideMenuBar: true,
    icon: resolveIcon(),
    backgroundColor: '#e9eef4',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      zoomFactor: 1,
      defaultFontFamily: {
        standard: 'Segoe UI',
        serif: 'Segoe UI',
        sansSerif: 'Segoe UI',
        monospace: 'Consolas',
      },
    },
  });

  mainWindow.webContents.setZoomFactor(1);
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.control && (input.key === '+' || input.key === '-' || input.key === '0')) {
      /* блок pinch/zoom shortcuts */
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.loadURL(WEB_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  initAutoUpdater({ webUrl: WEB_URL });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('desktop:getApiBaseUrl', () => API_URL);
ipcMain.handle('desktop:getCompanyLoginCode', () => process.env.AURENT_COMPANY_CODE || '');
ipcMain.handle('desktop:reload', () => mainWindow?.reload());
ipcMain.handle('desktop:toggleFullscreen', () => {
  if (!mainWindow) return false;
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
  return mainWindow.isFullScreen();
});
ipcMain.handle('desktop:quit', () => app.quit());
ipcMain.handle('desktop:showOnScreenKeyboard', () => {
  showOnScreenKeyboard();
  return true;
});

/**
 * Aurent Cashier — Electron main process
 * Окно 1024×768+, zoomFactor 1, зелёная иконка.
 */
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { showOnScreenKeyboard } = require('./onScreenKeyboard');
const { initAutoUpdater } = require('./autoUpdaterBridge');
const { resolveDesktopUrls } = require('../config/desktopUrls');

const { webUrl: WEB_URL, apiUrl: API_URL } = resolveDesktopUrls({ isPackaged: app.isPackaged });
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

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL !== WEB_URL) return;
    const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Aurent Cashier</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#e9eef4;color:#1e293b;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;box-sizing:border-box}
.card{max-width:480px;background:#fff;border-radius:12px;padding:24px;box-shadow:0 8px 32px rgb(15 23 42 / 0.12)}
h1{margin:0 0 12px;font-size:1.25rem}p{margin:0 0 8px;line-height:1.5;color:#475569}code{font-size:.85rem;background:#f1f5f9;padding:2px 6px;border-radius:4px;word-break:break-all}</style></head>
<body><div class="card"><h1>Не удалось загрузить интерфейс</h1>
<p>Проверьте интернет и попробуйте снова.</p>
<p><code>${validatedURL}</code></p>
<p>Ошибка ${errorCode}: ${errorDescription}</p></div></body></html>`;
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
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

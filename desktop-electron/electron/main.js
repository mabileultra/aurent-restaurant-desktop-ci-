/**
 * Aurent Cashier — Electron main process
 * Окно 1024×768+, zoomFactor 1, зелёная иконка.
 */
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const ICON_PNG = path.join(__dirname, '..', 'build', 'icon.png');
const { showOnScreenKeyboard } = require('./onScreenKeyboard');
const { initAutoUpdater, checkForUpdatesNow } = require('./autoUpdaterBridge');
const { loadDesktopConfig, buildLoginUrl } = require('./config/desktopConfig');
const { buildAppMenu } = require('./menu/appMenu');
const {
  openServerSettings,
  ensureInitialServerConfig,
  reloadCashierLogin,
} = require('./session/cashierSession');

const { attachDesktopNavigationGuard } = require('./navigation/desktopNavigationGuard');

let mainWindow = null;
let desktopConfig = null;

function resolveIcon() {
  if (fs.existsSync(ICON_PNG)) return ICON_PNG;
  return undefined;
}

function refreshDesktopConfig() {
  desktopConfig = loadDesktopConfig({ isPackaged: app.isPackaged });
  return desktopConfig;
}

function getStartupLoginUrl() {
  return buildLoginUrl(refreshDesktopConfig());
}

function createWindow(startUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    autoHideMenuBar: false,
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
    if (process.platform === 'win32') {
      mainWindow.setMenuBarVisibility(true);
    }
    mainWindow.show();
    mainWindow.focus();
  });

  const loginUrl = startUrl || getStartupLoginUrl();

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL !== loginUrl) return;
    const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Aurent Cashier</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#e9eef4;color:#1e293b;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;box-sizing:border-box}
.card{max-width:480px;background:#fff;border-radius:12px;padding:24px;box-shadow:0 8px 32px rgb(15 23 42 / 0.12)}
h1{margin:0 0 12px;font-size:1.25rem}p{margin:0 0 8px;line-height:1.5;color:#475569}code{font-size:.85rem;background:#f1f5f9;padding:2px 6px;border-radius:4px;word-break:break-all}</style></head>
<body><div class="card"><h1>Не удалось загрузить интерфейс</h1>
<p>Проверьте интернет и настройки сервера (Вид → Настройка сервера).</p>
<p><code>${validatedURL}</code></p>
<p>Ошибка ${errorCode}: ${errorDescription}</p></div></body></html>`;
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  });

  mainWindow.loadURL(loginUrl);

  attachDesktopNavigationGuard(mainWindow, refreshDesktopConfig);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function handleOpenServerSettings() {
  return openServerSettings({
    mainWindow,
    onConfigSaved: (next) => {
      desktopConfig = next;
    },
  });
}

app.whenReady().then(async () => {
  refreshDesktopConfig();

  const hasConfig = await ensureInitialServerConfig();
  if (!hasConfig) {
    app.quit();
    return;
  }

  refreshDesktopConfig();

  buildAppMenu({
    openServerSettings: handleOpenServerSettings,
    reloadPage: async () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        await reloadCashierLogin(mainWindow, refreshDesktopConfig());
      }
    },
    checkForUpdates: checkForUpdatesNow,
  });

  const { registerOfflineIpc } = require('./offline/ipc.cjs');
  registerOfflineIpc(
    () => refreshDesktopConfig(),
    async (cfg, { timeoutMs = 2000 } = {}) => {
      const url = cfg?.apiHealthUrl
        || (cfg?.backendOrigin ? `${cfg.backendOrigin}/api/v1/actuator/health` : '');
      if (!url) return false;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(url, { method: 'GET', signal: controller.signal });
        clearTimeout(timer);
        return Boolean(res?.ok);
      } catch {
        return false;
      }
    },
  );

  try {
    const localDb = require('./offline/index.cjs');
    await localDb.getDb();
  } catch (err) {
    console.error('[offline] db prewarm failed:', err?.message || err);
  }

  createWindow(getStartupLoginUrl());
  const { setMainWindow } = require('./printers/window-ref.cjs');
  setMainWindow(mainWindow);
  const { registerPrinterIpc } = require('./registerPrinterIpc');
  registerPrinterIpc();
  initAutoUpdater({ webUrl: desktopConfig.cashierUrl });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(getStartupLoginUrl());
      setMainWindow(mainWindow);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('desktop:getApiBaseUrl', () => refreshDesktopConfig().apiUrl);
ipcMain.handle('desktop:getCompanyLoginCode', () => refreshDesktopConfig().companyLoginCode || '');
ipcMain.handle('desktop:reload', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  return reloadCashierLogin(mainWindow, refreshDesktopConfig());
});
ipcMain.handle('desktop:get-terminal-identity', () => {
  const { getTerminalIdentity } = require('./identity/deviceIdentity');
  return getTerminalIdentity();
});
ipcMain.handle('desktop:open-server-setup', () => handleOpenServerSettings());
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

const { multikassaRequest } = require('./multikassa/multikassaProxy');
ipcMain.handle('desktop:multikassaRequest', (_event, payload) => multikassaRequest(payload));

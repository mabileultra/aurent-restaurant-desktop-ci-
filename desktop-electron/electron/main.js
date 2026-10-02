/**
 * Aurent Cashier — Electron main process
 * Окно 1024×768+, zoomFactor 1, зелёная иконка.
 */
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain, shell, dialog, net, session } = require('electron');
const ICON_PNG = path.join(__dirname, '..', 'build', 'icon.png');
const { showOnScreenKeyboard } = require('./onScreenKeyboard');
const { initAutoUpdater, checkForUpdatesNow } = require('./autoUpdaterBridge');
const { loadDesktopConfig, saveUiMode, saveOfflineFirst, saveRestaurantLocalFirst } = require('./config/desktopConfig');
const { buildAdminLoginUrl, APP_WORLD_RESTAURANT, normalizeAppWorld } = require('./config/loginUrl');
const { UI_MODE_REMOTE, UI_MODE_BUNDLED } = require('./config/uiMode');
const { buildAppMenu } = require('./menu/appMenu');
const {
  openServerSettings,
  ensureInitialServerConfig,
  reloadCashierLogin,
} = require('./session/cashierSession');
const { attachDesktopNavigationGuard } = require('./navigation/desktopNavigationGuard');
const { createCashierUiSession } = require('./ui/cashierUiSession');
const { attachLoadFailureFallback } = require('./ui/loadFailureFallback');
const {
  registerRestaurantOfflineIpc,
  startRestaurantOfflineRuntime,
  stopRestaurantOfflineRuntime,
} = require('./restaurant-offline/ipc/registerRestaurantOfflineIpc.cjs');

let mainWindow = null;
let desktopConfig = null;
let uiSession = null;

function resolveIcon() {
  if (fs.existsSync(ICON_PNG)) return ICON_PNG;
  return undefined;
}

function refreshDesktopConfig() {
  desktopConfig = loadDesktopConfig({ isPackaged: app.isPackaged });
  return desktopConfig;
}

function rebuildAppMenu() {
  const cfg = refreshDesktopConfig();
  buildAppMenu({
    openServerSettings: handleOpenServerSettings,
    reloadPage: reloadActiveUi,
    checkForUpdates: checkForUpdatesNow,
    uiMode: cfg.uiMode,
    allowBundledUi: cfg.allowBundledUi,
    setUiMode: handleSetUiMode,
    offlineFirst: cfg.offlineFirst,
    setOfflineFirst: handleSetOfflineFirst,
    restaurantLocalFirst: cfg.restaurantLocalFirst,
    setRestaurantLocalFirst: handleSetRestaurantLocalFirst,
    appWorld: cfg.appWorld,
    openActivityLogs: () => {
      const { openActivityLogViewer, appendActivityLog } = require('./activity-log/activityLogIpc.cjs');
      appendActivityLog({
        category: 'system',
        level: 'info',
        message: 'Открыт журнал операций',
      });
      openActivityLogViewer(mainWindow);
    },
    openAdminLogin: () => reloadCashierLogin(mainWindow, refreshDesktopConfig(), {
      clearSession: true,
      loginUrl: buildAdminLoginUrl(refreshDesktopConfig()),
    }),
    openActivityLogFolder: async () => {
      const { ensureLogsDir, logsRootDir } = require('./activity-log/activityLogStore.cjs');
      ensureLogsDir();
      await shell.openPath(logsRootDir());
    },
  });
}

async function reloadActiveUi({ clearSession = false, navigateToStart = false } = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { ok: false, reason: 'no_window' };
  }
  const online = typeof net.isOnline === 'function' ? net.isOnline() : true;
  const currentUrl = mainWindow.webContents.getURL() || '';

  // «Обновить» без сети убивает remote UI (ERR_INTERNET_DISCONNECTED) — не трогаем страницу.
  if (!clearSession && !navigateToStart && !online) {
    return {
      ok: false,
      reason: 'offline',
      url: currentUrl,
      source: 'current',
    };
  }

  // Обычный soft reload: сначала страница, потом ensureStartUrl (иначе UI ждёт сеть/старт).
  if (!clearSession && !navigateToStart && currentUrl && !currentUrl.startsWith('data:')) {
    try {
      mainWindow.webContents.reloadIgnoringCache();
    } catch {
      mainWindow.reload();
    }
    try {
      const start = await uiSession.ensureStartUrl();
      return {
        ok: true,
        url: start.url,
        source: start.source,
        reason: start.reason,
      };
    } catch {
      return { ok: true, url: currentUrl, source: 'current' };
    }
  }

  const start = await uiSession.ensureStartUrl();

  // «Обновить» = soft reload текущей страницы. Не кидать на PIN-логин.
  if (clearSession || navigateToStart) {
    if (!online) {
      return { ok: false, reason: 'offline', url: start.url, source: start.source };
    }
    await reloadCashierLogin(mainWindow, refreshDesktopConfig(), {
      clearSession,
      loginUrl: start.url,
    });
  } else if (currentUrl.startsWith('data:')) {
    // Уже на error/offline card — при наличии сети вернуться на start URL.
    await reloadCashierLogin(mainWindow, refreshDesktopConfig(), {
      clearSession: false,
      loginUrl: start.url,
    });
  } else {
    try {
      mainWindow.webContents.reloadIgnoringCache();
    } catch {
      mainWindow.reload();
    }
  }
  // IPC cannot clone localServer / functions — return a plain snapshot only.
  return {
    ok: true,
    url: start.url,
    source: start.source,
    reason: start.reason,
  };
}

async function handleSetUiMode(mode) {
  saveUiMode(mode);
  refreshDesktopConfig();
  rebuildAppMenu();
  const start = await reloadActiveUi({ navigateToStart: true });
  if (mode === UI_MODE_BUNDLED && start?.source !== 'bundled') {
    saveUiMode(UI_MODE_REMOTE);
    refreshDesktopConfig();
    rebuildAppMenu();
    dialog.showMessageBox({
      type: 'warning',
      title: 'Aurent Cashier',
      message: 'Локальный интерфейс недоступен',
      detail: 'Вернулись к интерфейсу с сайта. Соберите UI (npm run bundle-ui) или оставьте режим «с сайта».',
      buttons: ['OK'],
    }).catch(() => {});
  }
  return start;
}

async function handleSetOfflineFirst(enabled) {
  saveOfflineFirst(enabled);
  refreshDesktopConfig();
  rebuildAppMenu();
  return reloadActiveUi({ navigateToStart: true });
}

async function handleSetRestaurantLocalFirst(enabled) {
  saveRestaurantLocalFirst(enabled);
  refreshDesktopConfig();
  rebuildAppMenu();
  if (enabled) {
    try {
      await startRestaurantOfflineRuntime({ loadConfig: () => refreshDesktopConfig() });
    } catch (err) {
      console.error('[rst-offline] runtime start failed:', err?.message || err);
    }
  } else {
    stopRestaurantOfflineRuntime();
  }
  const start = await reloadActiveUi({ navigateToStart: true });
  if (enabled && start?.source !== 'bundled') {
    saveRestaurantLocalFirst(false);
    stopRestaurantOfflineRuntime();
    refreshDesktopConfig();
    rebuildAppMenu();
    dialog.showMessageBox({
      type: 'warning',
      title: 'Aurent Cashier',
      message: 'Локальный UI ресторана недоступен',
      detail:
        'Соберите restaurant UI: npm run bundle-restaurant-ui (папка ui-restaurant). Пока оставлен сайт r-aurent.',
      buttons: ['OK'],
    }).catch(() => {});
  }
  return start;
}

async function handleBundledLoadFallback() {
  saveUiMode(UI_MODE_REMOTE);
  const start = await uiSession.fallbackToRemote();
  refreshDesktopConfig();
  rebuildAppMenu();
  if (mainWindow && !mainWindow.isDestroyed()) {
    await mainWindow.loadURL(start.url);
  }
  dialog.showMessageBox({
    type: 'warning',
    title: 'Aurent Cashier',
    message: 'Локальный интерфейс не открылся',
    detail: 'Включён интерфейс с сайта — как у клиентов сейчас. Меню: Вид → Интерфейс с сайта.',
    buttons: ['OK'],
  }).catch(() => {});
  return start;
}

function createWindow(start) {
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

  const revealWindow = () => {
    if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isVisible()) return;
    if (process.platform === 'win32') {
      mainWindow.setMenuBarVisibility(true);
    }
    mainWindow.show();
    mainWindow.focus();
  };

  // Не ждать вечно ready-to-show — на Mac окно иначе «прыгает» в Dock без UI.
  mainWindow.once('ready-to-show', revealWindow);
  mainWindow.webContents.once('did-finish-load', revealWindow);
  mainWindow.webContents.once('did-fail-load', () => revealWindow());
  setTimeout(revealWindow, 1500);

  attachLoadFailureFallback(mainWindow, {
    getExpectedUrl: () => uiSession.getLastStart()?.url,
    getStartSource: () => uiSession.getLastStart()?.source,
    fallbackToRemote: handleBundledLoadFallback,
  });

  console.log('[ui]', start.source, start.url);
  mainWindow.loadURL(start.url);

  if (process.env.AURENT_UI_DEV === '1') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (level >= 2) {
      console.error('[renderer]', message, sourceId ? `(${sourceId}:${line})` : '');
    }
  });

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
    resolveLoginUrl: () => uiSession.ensureStartUrl(),
  });
}

app.whenReady().then(async () => {
  uiSession = createCashierUiSession({
    loadConfig: () => refreshDesktopConfig(),
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    appPath: app.getAppPath(),
  });

  refreshDesktopConfig();

  const hasConfig = await ensureInitialServerConfig();
  if (!hasConfig) {
    app.quit();
    return;
  }

  refreshDesktopConfig();
  rebuildAppMenu();

  const { registerOfflineIpc } = require('./offline/ipc.cjs');
  const { registerActivityLogIpc, appendActivityLog } = require('./activity-log/activityLogIpc.cjs');
  registerActivityLogIpc();
  registerRestaurantOfflineIpc({
    loadConfig: () => refreshDesktopConfig(),
  });
  appendActivityLog({
    category: 'system',
    level: 'info',
    message: 'Касса запущена',
    meta: {
      offlineFirst: Boolean(refreshDesktopConfig().offlineFirst),
      restaurantLocalFirst: Boolean(refreshDesktopConfig().restaurantLocalFirst),
      uiMode: refreshDesktopConfig().uiMode,
      appWorld: refreshDesktopConfig().appWorld,
    },
  });
  const { noteUpstreamSuccess, noteUpstreamFailure } = require('./ui/apiProxyCircuit');
  registerOfflineIpc(
    () => refreshDesktopConfig(),
    async (cfg, { timeoutMs } = {}) => {
      const localFirst = Boolean(
        cfg?.offlineFirst
        || (normalizeAppWorld(cfg?.appWorld) === APP_WORLD_RESTAURANT && cfg?.restaurantLocalFirst),
      );
      const ms = timeoutMs ?? (localFirst ? 800 : 2000);
      const url = cfg?.apiHealthUrl
        || (cfg?.backendOrigin ? `${cfg.backendOrigin}/api/v1/actuator/health` : '');
      if (!url) return false;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        const res = await fetch(url, { method: 'GET', signal: controller.signal });
        clearTimeout(timer);
        const ok = Boolean(res?.ok);
        if (ok) noteUpstreamSuccess();
        return ok;
      } catch (err) {
        noteUpstreamFailure(err);
        return false;
      }
    },
  );

  // Не блокируем показ окна на прогреве offline DB.
  void (async () => {
    try {
      const localDb = require('./offline/index.cjs');
      await localDb.getDb();
    } catch (err) {
      console.error('[offline] db prewarm failed:', err?.message || err);
    }
  })();

  // Restaurant local-first: SQLite + print/outbox workers (dark flag).
  void (async () => {
    try {
      const cfg = refreshDesktopConfig();
      if (
        normalizeAppWorld(cfg.appWorld) === APP_WORLD_RESTAURANT
        && cfg.restaurantLocalFirst
      ) {
        await startRestaurantOfflineRuntime({ loadConfig: () => refreshDesktopConfig() });
      }
    } catch (err) {
      console.error('[rst-offline] runtime start failed:', err?.message || err);
    }
  })();

  const start = await uiSession.ensureStartUrl();
  try {
    await session.defaultSession.clearCache();
  } catch (err) {
    console.error('[ui] cache clear failed', err?.message || err);
  }
  createWindow(start);
  const { setMainWindow } = require('./printers/window-ref.cjs');
  setMainWindow(mainWindow);
  const { registerPrinterIpc } = require('./registerPrinterIpc');
  registerPrinterIpc();
  initAutoUpdater({ webUrl: desktopConfig.cashierUrl });

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const next = await uiSession.ensureStartUrl();
      createWindow(next);
      setMainWindow(mainWindow);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopRestaurantOfflineRuntime();
  if (uiSession) {
    uiSession.stopLocal().catch(() => {});
  }
});

ipcMain.handle('desktop:getApiBaseUrl', () => refreshDesktopConfig().apiUrl);
ipcMain.on('desktop:get-offline-first-sync', (event) => {
  try {
    const cfg = refreshDesktopConfig();
    const restaurantLf =
      normalizeAppWorld(cfg.appWorld) === APP_WORLD_RESTAURANT
      && Boolean(cfg.restaurantLocalFirst);
    event.returnValue = Boolean(cfg.offlineFirst || restaurantLf);
  } catch {
    event.returnValue = false;
  }
});
ipcMain.on('desktop:get-restaurant-local-first-sync', (event) => {
  try {
    event.returnValue = Boolean(refreshDesktopConfig().restaurantLocalFirst);
  } catch {
    event.returnValue = false;
  }
});
ipcMain.handle('desktop:getCompanyLoginCode', () => refreshDesktopConfig().companyLoginCode || '');
ipcMain.handle('desktop:reload', () => reloadActiveUi());
ipcMain.handle('desktop:get-terminal-identity', () => {
  const { getTerminalIdentity } = require('./identity/deviceIdentity');
  return getTerminalIdentity();
});
ipcMain.handle('desktop:open-server-setup', () => handleOpenServerSettings());
ipcMain.handle('desktop:set-restaurant-local-first', (_event, enabled) =>
  handleSetRestaurantLocalFirst(Boolean(enabled)),
);
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

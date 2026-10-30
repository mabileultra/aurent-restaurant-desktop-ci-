/**
 * Aurent Restaurant — local-first hall desktop (NOT Aurent Cashier).
 * Window talks only to localhost UI + local restaurant-service (edge).
 */
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain } = require('electron');
const { createWindowOpenHandler } = require('./runtime/windowOpenPolicy');
const { resolveUiRoot, SERVICE_HOST, SERVICE_PORT } = require('./config');
const { ensureEdgeService, shutdownEdgeStack, getStackStatus } = require('./runtime/edgeStack');
const { startLocalUiServer } = require('./ui/localUiServer');
const {
  getLocalAuthStatus,
  getLocalBootstrapStatus,
  bootstrapStaffFromCloud,
  fetchCloudPinRoster,
  ensureStaffViaCloudPin,
} = require('./runtime/edgeAuthBootstrap');
const { startEdgeOnlineReconcileLoop } = require('./runtime/edgeOnlineReconcileLoop');
const { resolveLanHubEnabled } = require('./runtime/edgeLanHubConfig');
const { listLanIpv4, primaryLanIpv4 } = require('./runtime/edgeLanAddresses');
const {
  getCompanyLoginCode,
  setCompanyLoginCode,
} = require('./runtime/companyCodeStore');
const { buildAppMenu, normalizeLocale } = require('./menu/appMenu');
const { setMainWindow } = require('./printers/window-ref.cjs');
const { registerPrinterIpc } = require('./printers/registerPrinterIpc');
const { initAutoUpdater } = require('./autoUpdaterBridge');
const { multikassaRequest } = require('./multikassa/multikassaProxy');

let menuLocale = 'ru';

function applyAppMenu() {
  buildAppMenu({
    locale: menuLocale,
    reloadPage: () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.reload();
      }
    },
  });
}

let mainWindow = null;
let uiServer = null;
let lastStatus = {
  phase: 'starting',
  online: false,
  serviceHealthy: false,
  pendingOutbox: 0,
  pendingOfd: 0,
  message: 'Starting…',
};

function publishStatus(patch) {
  lastStatus = { ...lastStatus, ...patch, at: Date.now() };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('restaurant:status', lastStatus);
  }
}

let lastBootDetail = '';

function bootMsg(text) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.executeJavaScript(
    `window.__bootMsg && window.__bootMsg(${JSON.stringify(String(text))})`
  ).catch(() => {});
}

/** Internal progress only — never dump raw Postgres/Spring lines into the splash. */
function bootLog(line, isErr = false) {
  const text = String(line || '');
  lastBootDetail = text.slice(0, 800);
  if (isErr) console.error('[boot]', text);
  else console.log('[boot]', text.slice(0, 240));

  const lower = text.toLowerCase();
  if (isErr) return;
  if (lower.includes('waiting until postgres') || lower.includes('create db retry')) {
    bootMsg('Ожидание базы данных');
  } else if (lower.includes('initdb') || lower.includes('pgdata') || lower.includes('postgres')) {
    bootMsg('Подготовка локальной базы');
  } else if (lower.includes('waiting for service')) {
    bootMsg('Первый запуск: подготовка базы');
  } else if (lower.includes('starting jar') || lower.includes('java:') || lower.includes('spring boot')) {
    bootMsg('Запуск сервиса ресторана');
  } else if (lower.includes('database ') || lower.includes('listening')) {
    bootMsg('Почти готово');
  } else if (lower.includes('ui server')) {
    bootMsg('Открытие интерфейса');
  } else if (lower.includes('liquibase') || lower.includes('hikari')) {
    bootMsg('Миграции базы данных');
  }
}

function bootFail(title, detail) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.executeJavaScript(
    `window.__bootFail && window.__bootFail(${JSON.stringify(String(title))}, ${JSON.stringify(String(detail || lastBootDetail || ''))})`
  ).catch(() => {});
}

function resolveAppIcon() {
  const iconPath = path.join(__dirname, '..', 'ra.png');
  return fs.existsSync(iconPath) ? iconPath : undefined;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Aurent Restaurant',
    icon: resolveAppIcon(),
    backgroundColor: '#0f172a',
    show: false,
    fullscreen: true,
    // Native menu stays available via Alt — do not permanently eat vertical space on Windows.
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (!mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(true);
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.loadFile(path.join(__dirname, 'boot.html'));
  setMainWindow(mainWindow);
  mainWindow.webContents.setWindowOpenHandler(
    createWindowOpenHandler(() => mainWindow),
  );
  mainWindow.on('closed', () => {
    mainWindow = null;
    setMainWindow(null);
  });
}

async function bootStack() {
  publishStatus({ phase: 'service', message: 'Starting local DB + restaurant-service…' });
  bootMsg('Запуск');
  lastBootDetail = '';

  try {
    await ensureEdgeService({
      isPackaged: app.isPackaged,
      log: (line) => bootLog(line),
    });
  } catch (err) {
    const msg = err?.message || String(err);
    bootLog(msg, true);
    publishStatus({ phase: 'error', message: msg, serviceHealthy: false });
    bootFail('Не удалось запустить локальный сервис', msg);
    return;
  }

  publishStatus({ phase: 'ui', serviceHealthy: true, message: 'Starting local UI…' });
  bootMsg('Открытие интерфейса');
  const uiRoot = resolveUiRoot(app.isPackaged);
  if (!fs.existsSync(path.join(uiRoot, 'index.html'))) {
    const msg = 'UI не собран. В папке restaurant-desktop: npm run bundle-ui';
    bootLog(msg, true);
    publishStatus({ phase: 'error', message: msg });
    bootFail('Интерфейс не найден', msg);
    return;
  }

  const backendOrigin = `http://${SERVICE_HOST}:${SERVICE_PORT}`;
  // Phase H: phones/kitchen on Wi‑Fi → this PC. Packaged default ON; env/file can override.
  const lanHub = resolveLanHubEnabled({ isPackaged: app.isPackaged });
  const uiHost = lanHub ? '0.0.0.0' : '127.0.0.1';
  // Fixed port so localStorage (company code, theme) survives restarts.
  const preferredUiPort = Number(process.env.RESTAURANT_UI_PORT || 17887);
  let lastListenErr = null;
  for (let offset = 0; offset < 5; offset += 1) {
    const tryPort = preferredUiPort + offset;
    try {
      uiServer = await startLocalUiServer({
        uiRoot,
        backendOrigin,
        host: uiHost,
        port: tryPort,
      });
      lastListenErr = null;
      break;
    } catch (err) {
      lastListenErr = err;
      bootLog(`[edge] UI port ${tryPort} busy: ${err.message || err}`);
    }
  }
  if (!uiServer) {
    throw lastListenErr || new Error('UI server failed to bind');
  }
  const localUiOrigin = `http://127.0.0.1:${uiServer.port}`;
  const lanIps = lanHub ? listLanIpv4() : [];
  const lanPrimary = lanHub ? primaryLanIpv4() : null;
  const lanHubUrls = lanIps.map((ip) => `http://${ip}:${uiServer.port}`);
  bootLog(`UI server: ${localUiOrigin}${lanHub ? ' (LAN hub 0.0.0.0)' : ''}`);
  if (lanHub && lanHubUrls.length) {
    bootLog(`LAN phones: ${lanHubUrls.join(' | ')}  (same Wi‑Fi as this PC)`);
  } else if (lanHub) {
    bootLog('LAN hub on, but no LAN IPv4 yet — check Wi‑Fi / firewall for port UI');
  }
  publishStatus({
    phase: 'ready',
    online: false,
    serviceHealthy: true,
    message: lanHub ? 'Local hall ready (LAN hub)' : 'Local hall ready',
    uiOrigin: localUiOrigin,
    lanHub,
    lanHubUrl: lanPrimary ? `http://${lanPrimary}:${uiServer.port}` : null,
    lanHubUrls,
  });

  if (mainWindow && !mainWindow.isDestroyed()) {
    // Window always uses localhost; LAN clients use the machine IP + uiServer.port
    await mainWindow.loadURL(localUiOrigin);
  }

  startEdgeOnlineReconcileLoop({
    publishStatus,
    getLastStatus: () => lastStatus,
  });
}

app.whenReady().then(async () => {
  ipcMain.handle('restaurant:get-status', async () => ({
    ...lastStatus,
    stack: getStackStatus(),
  }));
  ipcMain.handle('restaurant:get-lan-hub', async () => ({
    enabled: Boolean(lastStatus.lanHub),
    lanHubUrl: lastStatus.lanHubUrl || null,
    lanHubUrls: lastStatus.lanHubUrls || [],
    uiOrigin: lastStatus.uiOrigin || null,
  }));
  ipcMain.handle('restaurant:get-edge-auth-status', async () => {
    try {
      return await getLocalBootstrapStatus();
    } catch (err) {
      try {
        return await getLocalAuthStatus();
      } catch (inner) {
        return { edge: true, hasStaff: false, hasCatalog: false, error: inner.message || err.message };
      }
    }
  });
  ipcMain.handle('restaurant:bootstrap-staff-from-cloud', async (_e, payload) => {
    return bootstrapStaffFromCloud(payload || {});
  });
  ipcMain.handle('restaurant:fetch-cloud-pin-roster', async (_e, companyLoginCode) => {
    return fetchCloudPinRoster(companyLoginCode);
  });
  ipcMain.handle('restaurant:ensure-staff-via-cloud-pin', async (_e, payload) => {
    return ensureStaffViaCloudPin(payload || {});
  });
  ipcMain.handle('restaurant:get-company-login-code', async () => getCompanyLoginCode());
  ipcMain.handle('restaurant:set-company-login-code', async (_e, code) => setCompanyLoginCode(code));
  ipcMain.handle('restaurant:set-menu-locale', async (_e, locale) => {
    menuLocale = normalizeLocale(locale);
    applyAppMenu();
    return { locale: menuLocale };
  });
  ipcMain.handle('restaurant:push-cloud-sync', async () => {
    const http = require('http');
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: SERVICE_HOST,
          port: SERVICE_PORT,
          path: '/api/v1/edge/sync/push',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        (res) => {
          let raw = '';
          res.on('data', (c) => { raw += c; });
          res.on('end', () => {
            try {
              resolve(raw ? JSON.parse(raw) : {});
            } catch {
              resolve({ raw });
            }
          });
        }
      );
      req.on('error', reject);
      req.end();
    });
  });

  applyAppMenu();
  registerPrinterIpc();
  ipcMain.handle('desktop:quit', () => {
    app.quit();
    return { ok: true };
  });
  ipcMain.handle('desktop:toggleFullscreen', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
    return { ok: true };
  });
  ipcMain.handle('desktop:reload', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.reload();
    }
    return { ok: true };
  });
  ipcMain.handle('desktop:multikassaRequest', (_event, payload) => multikassaRequest(payload || {}));
  ipcMain.handle('desktop:getCompanyLoginCode', async () => getCompanyLoginCode());
  initAutoUpdater();
  createWindow();
  await bootStack();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      bootStack();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  await shutdownEdgeStack({ log: (line) => bootLog(line) });
  if (uiServer) {
    await uiServer.close();
    uiServer = null;
  }
});

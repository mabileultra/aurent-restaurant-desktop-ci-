/**
 * Aurent Restaurant — local-first hall desktop (NOT Aurent Cashier).
 * Window talks only to localhost UI + local restaurant-service (edge).
 */
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain } = require('electron');
const { resolveUiRoot, SERVICE_HOST, SERVICE_PORT, HEALTH_URL } = require('./config');
const { ensureEdgeService, shutdownEdgeStack, getStackStatus } = require('./runtime/edgeStack');
const { probeHealth } = require('./runtime/health');
const { startLocalUiServer } = require('./ui/localUiServer');
const {
  getLocalAuthStatus,
  getLocalBootstrapStatus,
  bootstrapStaffFromCloud,
  fetchCloudPinRoster,
  ensureStaffViaCloudPin,
  refreshLiveFromCloud,
  pushLiveToCloud,
} = require('./runtime/edgeAuthBootstrap');
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
    // Native menu stays available via Alt — do not permanently eat vertical space on Windows.
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'boot.html'));
  setMainWindow(mainWindow);
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
  // LAN hub: kitchen / phones on restaurant Wi‑Fi hit this PC (RESTAURANT_LAN_HUB=1).
  const lanHub = process.env.RESTAURANT_LAN_HUB === '1' || process.env.RESTAURANT_LAN_HUB === 'true';
  const uiHost = lanHub ? '0.0.0.0' : '127.0.0.1';
  // Fixed port so localStorage (company code, theme) survives restarts.
  // Random port:0 made every launch a new origin → empty company code.
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
  bootLog(`UI server: ${uiServer.origin}${lanHub ? ' (LAN hub)' : ''}`);
  publishStatus({
    phase: 'ready',
    online: false,
    serviceHealthy: true,
    message: lanHub ? 'Local hall ready (LAN hub)' : 'Local hall ready',
    uiOrigin: localUiOrigin,
    lanHub,
  });

  if (mainWindow && !mainWindow.isDestroyed()) {
    // Window always uses localhost; LAN clients use the machine IP + uiServer.port
    await mainWindow.loadURL(localUiOrigin);
  }

  let syncInFlight = false;
  let lastLiveSyncAt = 0;
  let liveSyncInFlight = false;
  const LIVE_SYNC_MS = 10_000;
  setInterval(async () => {
    const hit = await probeHealth(HEALTH_URL);
    let pendingOutbox = lastStatus.pendingOutbox || 0;
    // DNS alone is not enough (school filters often resolve but block HTTPS).
    let online = false;
    try {
      online = await new Promise((resolve) => {
        const https = require('https');
        const req = https.get(
          'https://r-aurent.uz/api/v1/actuator/health',
          { timeout: 4000 },
          (res) => {
            res.resume();
            resolve(res.statusCode >= 200 && res.statusCode < 500);
          }
        );
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
      });
    } catch {
      online = false;
    }
    try {
      const http = require('http');
      pendingOutbox = await new Promise((resolve) => {
        http.get(`http://${SERVICE_HOST}:${SERVICE_PORT}/api/v1/edge/sync/status`, (res) => {
          let raw = '';
          res.on('data', (c) => { raw += c; });
          res.on('end', () => {
            try {
              const j = JSON.parse(raw);
              resolve(Number(j.pending || 0) + Number(j.failed || 0));
            } catch {
              resolve(pendingOutbox);
            }
          });
        }).on('error', () => resolve(pendingOutbox));
      });
    } catch {
      /* ignore */
    }
    publishStatus({ serviceHealthy: hit.ok, pendingOutbox, online });

    // Auto-push when uplink is back and there is a queue (OFD stays manual confirm in UI).
    if (online && pendingOutbox > 0 && !syncInFlight && process.env.RESTAURANT_CLOUD_SYNC_URL) {
      syncInFlight = true;
      try {
        await new Promise((resolve, reject) => {
          const http = require('http');
          const req = http.request(
            {
              hostname: SERVICE_HOST,
              port: SERVICE_PORT,
              path: '/api/v1/edge/sync/push',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            },
            (res) => {
              res.resume();
              res.on('end', resolve);
            }
          );
          req.on('error', reject);
          req.end();
        });
      } catch {
        /* next tick */
      } finally {
        syncInFlight = false;
      }
    }

    // One mutex: push hall SoT first, then pull. Parallel push+pull was racing
    // and could re-import a stale cloud snapshot over fresher local OPEN tables.
    if (online && !liveSyncInFlight && Date.now() - lastLiveSyncAt >= LIVE_SYNC_MS) {
      liveSyncInFlight = true;
      lastLiveSyncAt = Date.now();
      try {
        await pushLiveToCloud();
        await refreshLiveFromCloud();
      } catch {
        /* next tick */
      } finally {
        liveSyncInFlight = false;
      }
    }
  }, 5000);
}

app.whenReady().then(async () => {
  ipcMain.handle('restaurant:get-status', async () => ({
    ...lastStatus,
    stack: getStackStatus(),
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

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
} = require('./runtime/edgeAuthBootstrap');

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

function bootLog(line, isErr = false) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const safe = JSON.stringify(String(line).slice(0, 400));
    mainWindow.webContents.executeJavaScript(
      `window.__bootAppend && window.__bootAppend(${safe}, ${isErr ? 'true' : 'false'})`
    ).catch(() => {});
  }
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'boot.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function bootStack() {
  publishStatus({ phase: 'service', message: 'Starting local DB + restaurant-service…' });
  bootLog('Starting embedded Postgres (if needed) + restaurant-service…');

  try {
    await ensureEdgeService({
      isPackaged: app.isPackaged,
      log: (line) => bootLog(line),
    });
  } catch (err) {
    const msg = err?.message || String(err);
    bootLog(msg, true);
    publishStatus({ phase: 'error', message: msg, serviceHealthy: false });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(
        `window.__bootMsg && window.__bootMsg(${JSON.stringify('Не удалось запустить локальный сервис. См. лог.')})`
      ).catch(() => {});
    }
    return;
  }

  publishStatus({ phase: 'ui', serviceHealthy: true, message: 'Starting local UI…' });
  const uiRoot = resolveUiRoot(app.isPackaged);
  if (!fs.existsSync(path.join(uiRoot, 'index.html'))) {
    const msg = 'UI не собран. В папке restaurant-desktop: npm run bundle-ui';
    bootLog(msg, true);
    publishStatus({ phase: 'error', message: msg });
    return;
  }

  const backendOrigin = `http://${SERVICE_HOST}:${SERVICE_PORT}`;
  // LAN hub: kitchen / phones on restaurant Wi‑Fi hit this PC (RESTAURANT_LAN_HUB=1).
  const lanHub = process.env.RESTAURANT_LAN_HUB === '1' || process.env.RESTAURANT_LAN_HUB === 'true';
  const uiHost = lanHub ? '0.0.0.0' : '127.0.0.1';
  uiServer = await startLocalUiServer({ uiRoot, backendOrigin, host: uiHost, port: 0 });
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

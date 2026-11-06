/**
 * «Вид → Настройка сервера» — код компании + cloud API (пароль платформы — отдельное окно).
 */
const { BrowserWindow, ipcMain } = require('electron');
const { getCompanyLoginCode, setCompanyLoginCode } = require('../runtime/companyCodeStore');
const {
  DEFAULT_CLOUD_API,
  getCloudApiUrl,
  setCloudApiUrl,
} = require('../runtime/cloudApiUrlStore');
const { buildRestaurantSetupHtml } = require('./restaurantSetupHtml');

let setupWin = null;
let ipcReady = false;

function ensureIpc() {
  if (ipcReady) return;
  ipcReady = true;
  ipcMain.handle('restaurant-setup:get', () => ({
    companyLoginCode: getCompanyLoginCode() || '',
    cloudApiUrl: getCloudApiUrl() || DEFAULT_CLOUD_API,
  }));
  ipcMain.handle('restaurant-setup:save', (event, payload) => {
    const code = setCompanyLoginCode(payload?.companyLoginCode || '');
    const cloudApiUrl = setCloudApiUrl(payload?.cloudApiUrl || DEFAULT_CLOUD_API);
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) win.__restaurantSetupSaved = true;
    return { ok: true, companyLoginCode: code, cloudApiUrl };
  });
}

function openRestaurantSetupWindow(parent) {
  ensureIpc();
  if (setupWin && !setupWin.isDestroyed()) {
    setupWin.focus();
    return setupWin;
  }
  setupWin = new BrowserWindow({
    width: 440,
    height: 420,
    resizable: false,
    minimizable: false,
    maximizable: false,
    parent: parent && !parent.isDestroyed() ? parent : undefined,
    modal: Boolean(parent && !parent.isDestroyed()),
    title: 'Настройка сервера',
    backgroundColor: '#f1f5f9',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });
  setupWin.setMenuBarVisibility(false);
  setupWin.loadURL(buildRestaurantSetupHtml());
  setupWin.on('closed', () => {
    setupWin = null;
  });
  return setupWin;
}

module.exports = { openRestaurantSetupWindow };

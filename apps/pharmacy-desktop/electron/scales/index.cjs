/**
 * USB/RS-232 весы для кассы Aurent (Electron main process).
 * @see README.md в этой папке
 */

const scaleManager = require('./scale-manager.cjs');
const { readScaleSettings, writeScaleSettings } = require('./scale-config.cjs');
const { autoDetectPort } = require('./scale-auto-detect.cjs');
const { showScalePickerWindow } = require('./scale-picker-window.cjs');
const {
  listAdapters,
  getActiveAdapter,
  setActiveAdapter,
  pushPlu,
} = require('./scale-adapters.cjs');

function registerScaleIpc(ipcMain, getMainWindow) {
  scaleManager.setBroadcast((reading) => {
    const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
    if (win && !win.isDestroyed()) {
      win.webContents.send('desktop:scale-weight', reading);
    }
  });

  ipcMain.handle('desktop:scale-status', () => scaleManager.getStatus());
  ipcMain.handle('desktop:scale-list-ports', () => scaleManager.listSerialPorts());
  ipcMain.handle('desktop:scale-get-settings', () => readScaleSettings());
  ipcMain.handle('desktop:scale-set-settings', (_e, patch) => writeScaleSettings(patch || {}));
  ipcMain.handle('desktop:scale-start', () => scaleManager.startListening());
  ipcMain.handle('desktop:scale-stop', () => scaleManager.stopListening());
  ipcMain.handle('desktop:scale-capture', () => scaleManager.captureStable());
  ipcMain.handle('desktop:scale-is-available', async () => {
    const st = await scaleManager.getStatus();
    return Boolean(
      st.serialModuleLoaded
      || st.mockEnv
      || st.settings?.mock
      || st.settings?.port
      || st.settings?.host
    );
  });

  ipcMain.handle('desktop:scale-auto-detect', (_e, opts) =>
    autoDetectPort({ save: opts?.save !== false })
  );

  ipcMain.handle('desktop:open-scale-picker', async () => {
    const saved = await showScalePickerWindow(getMainWindow());
    return saved;
  });

  ipcMain.handle('desktop:scale-list-adapters', () => listAdapters());
  ipcMain.handle('desktop:scale-get-active-adapter', () => getActiveAdapter());
  ipcMain.handle('desktop:scale-set-active-adapter', (_e, adapterId) =>
    setActiveAdapter(String(adapterId || ''))
  );
  ipcMain.handle('desktop:scale-push-plu', (_e, items) => pushPlu(items || []));
}

module.exports = {
  registerScaleIpc,
  scaleManager,
  readScaleSettings,
  writeScaleSettings,
  autoDetectPort,
  showScalePickerWindow,
  listAdapters,
  getActiveAdapter,
  setActiveAdapter,
  pushPlu,
};

module.exports.autoDetectEthernet = require('./scale-ethernet.cjs').autoDetectEthernet;
module.exports.pushPluToShtrih = require('./scale-shtrih-udp.cjs').pushPluToShtrih;


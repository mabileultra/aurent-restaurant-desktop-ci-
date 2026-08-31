const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

const notImplemented = (name) => () => Promise.reject(new Error(`${name} not implemented in desktop shell`));

contextBridge.exposeInMainWorld('desktopCashier', {
  isDesktop: true,

  getApiBaseUrl: () => invoke('desktop:getApiBaseUrl'),
  getCompanyLoginCode: () => invoke('desktop:getCompanyLoginCode'),
  reload: () => invoke('desktop:reload'),
  toggleFullscreen: () => invoke('desktop:toggleFullscreen'),
  quit: () => invoke('desktop:quit'),
  showOnScreenKeyboard: () => invoke('desktop:showOnScreenKeyboard'),

  getPrinterSettings: notImplemented('getPrinterSettings'),
  openPrinterPicker: notImplemented('openPrinterPicker'),
  openLabelPrinterPicker: notImplemented('openLabelPrinterPicker'),
  openScalePicker: notImplemented('openScalePicker'),
  openBarcodePage: notImplemented('openBarcodePage'),
  checkForUpdates: () => invoke('desktop:checkForUpdates'),
  quitAndInstallUpdate: () => invoke('desktop:quitAndInstallUpdate'),
  onDesktopUpdate: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('desktop:update', handler);
    return () => ipcRenderer.removeListener('desktop:update', handler);
  },
  printReceiptEscpos: notImplemented('printReceiptEscpos'),
  printLabelsEscpos: notImplemented('printLabelsEscpos'),
  printLabelPage: notImplemented('printLabelPage'),
  printLabelTspl: notImplemented('printLabelTspl'),
  labelTsplGetSettings: notImplemented('labelTsplGetSettings'),
  labelTsplSetSettings: notImplemented('labelTsplSetSettings'),
  labelTsplAutoDetect: notImplemented('labelTsplAutoDetect'),
  scaleGetSettings: notImplemented('scaleGetSettings'),
  scaleListAdapters: notImplemented('scaleListAdapters'),
  scaleGetActiveAdapter: notImplemented('scaleGetActiveAdapter'),
  scaleSetActiveAdapter: notImplemented('scaleSetActiveAdapter'),
  scalePushPlu: notImplemented('scalePushPlu'),
  prepareForPrint: notImplemented('prepareForPrint'),
  offline_getCatalog: notImplemented('offline_getCatalog'),
  offline_saveSale: notImplemented('offline_saveSale'),
});

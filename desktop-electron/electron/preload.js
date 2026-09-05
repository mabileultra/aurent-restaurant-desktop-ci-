const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

const notImplemented = (name) => () => Promise.reject(new Error(`${name} not implemented in desktop shell`));

contextBridge.exposeInMainWorld('desktopCashier', {
  isDesktop: true,

  getApiBaseUrl: () => invoke('desktop:getApiBaseUrl'),
  getCompanyLoginCode: () => invoke('desktop:getCompanyLoginCode'),
  openServerSetup: () => invoke('desktop:open-server-setup'),
  getTerminalIdentity: () => invoke('desktop:get-terminal-identity'),
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

  offlineGetStatus: () => invoke('offline:get-status'),
  offlineImportBootstrap: (payload) => invoke('offline:import-bootstrap', payload),
  offlineListCategories: () => invoke('offline:list-categories'),
  offlineSearchProducts: (opts) => invoke('offline:search-products', opts || {}),
  offlineGetProductByBarcode: (barcode) => invoke('offline:get-product-by-barcode', barcode),
  offlineGetCurrentShift: (payload) => invoke('offline:get-current-shift', payload),
  offlineOpenShift: (payload) => invoke('offline:open-shift', payload),
  offlineSyncShiftFromServer: (payload) => invoke('offline:sync-shift-from-server', payload),
  offlineCloseShift: (payload) => invoke('offline:close-shift', payload),
  offlineSaveSale: (payload) => invoke('offline:save-sale', payload),
  offlineListPendingSales: () => invoke('offline:list-pending-sales'),
  offlineListMySales: (opts) => invoke('offline:list-my-sales', opts || {}),
  offlineMarkSalesSynced: (results) => invoke('offline:mark-sales-synced', results),
  offlineDecreaseStock: (payload) => invoke('offline:decrease-stock', payload),
  offlineCompleteCheckout: (payload) => invoke('offline:complete-checkout', payload),
  onOfflineConnectivity: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('offline:connectivity', handler);
    return () => ipcRenderer.removeListener('offline:connectivity', handler);
  },

  multikassaRequest: (payload) => invoke('desktop:multikassaRequest', payload),
});

const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

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

  listPrinters: () => invoke('desktop:list-printers'),
  getPrinterSettings: () => invoke('desktop:get-printer-settings'),
  setPrinterSettings: (settings) => invoke('desktop:set-printer-settings', settings),
  openPrinterPicker: () => invoke('desktop:open-printer-picker'),
  openLabelPrinterPicker: () => invoke('desktop:open-label-printer-picker'),
  openBarcodePage: () => invoke('desktop:open-barcode-page'),
  printReceiptEscpos: (payload) => invoke('desktop:print-receipt-escpos', payload),
  printZReportEscpos: (payload) => invoke('desktop:print-z-report-escpos', payload),
  printShiftReportEscpos: (payload) => invoke('desktop:print-shift-report-escpos', payload),
  printLabelsEscpos: (payload) => invoke('desktop:print-label-escpos', payload),
  printLabelPage: (opts) => invoke('print-label-page', opts || {}),
  printLabelTspl: (payload) => invoke('desktop:print-label-tspl', payload),
  labelTsplGetSettings: () => invoke('desktop:label-tspl-get-settings'),
  labelTsplSetSettings: (patch) => invoke('desktop:label-tspl-set-settings', patch),
  labelTsplAutoDetect: (opts) => invoke('desktop:label-tspl-auto-detect', opts || {}),

  checkForUpdates: () => invoke('desktop:checkForUpdates'),
  quitAndInstallUpdate: () => invoke('desktop:quitAndInstallUpdate'),
  onDesktopUpdate: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('desktop:update', handler);
    return () => ipcRenderer.removeListener('desktop:update', handler);
  },

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

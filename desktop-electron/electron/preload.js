const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

function readOfflineFirstFlag() {
  try {
    return Boolean(ipcRenderer.sendSync('desktop:get-offline-first-sync'));
  } catch {
    return false;
  }
}


contextBridge.exposeInMainWorld('desktopCashier', {
  isDesktop: true,
  // Snapshot at load (compat). Prefer *Flag() after LF toggle — booleans freeze at expose.
  offlineFirst: readOfflineFirstFlag(),
  offlineFirstFlag: () => readOfflineFirstFlag(),

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
  printTicketHtml: (payload) => invoke('desktop:print-ticket-html', payload || {}),
  /** RAW TSPL/ESC into a named Windows printer (USB label queue). */
  printRaw: (payload) => invoke('desktop:print-raw', payload || {}),
  printPlainEscpos: (payload) => invoke('desktop:print-plain-escpos', payload || {}),
  printZReportEscpos: (payload) => invoke('desktop:print-z-report-escpos', payload),
  printShiftReportEscpos: (payload) => invoke('desktop:print-shift-report-escpos', payload),
  printLabelsEscpos: (payload) => invoke('desktop:print-label-escpos', payload),
  printLabelPage: (opts) => invoke('print-label-page', opts || {}),
  printLabelTspl: (payload) => invoke('desktop:print-label-tspl', payload),
  labelTsplGetSettings: () => invoke('desktop:label-tspl-get-settings'),
  labelTsplSetSettings: (patch) => invoke('desktop:label-tspl-set-settings', patch),
  labelTsplAutoDetect: (opts) => invoke('desktop:label-tspl-auto-detect', opts || {}),

  scaleIsAvailable: () => invoke('desktop:scale-is-available'),
  scaleStatus: () => invoke('desktop:scale-status'),
  scaleListPorts: () => invoke('desktop:scale-list-ports'),
  scaleGetSettings: () => invoke('desktop:scale-get-settings'),
  scaleSetSettings: (patch) => invoke('desktop:scale-set-settings', patch),
  scaleStart: () => invoke('desktop:scale-start'),
  scaleStop: () => invoke('desktop:scale-stop'),
  scaleCapture: () => invoke('desktop:scale-capture'),
  scaleAutoDetect: (opts) => invoke('desktop:scale-auto-detect', opts || {}),
  openScalePicker: () => invoke('desktop:open-scale-picker'),
  scaleListAdapters: () => invoke('desktop:scale-list-adapters'),
  scaleGetActiveAdapter: () => invoke('desktop:scale-get-active-adapter'),
  scaleSetActiveAdapter: (adapterId) => invoke('desktop:scale-set-active-adapter', adapterId),
  scalePushPlu: (items) => invoke('desktop:scale-push-plu', items),
  onScaleWeight: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('desktop:scale-weight', handler);
    return () => ipcRenderer.removeListener('desktop:scale-weight', handler);
  },

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
  offlineImportCatalogDelta: (payload) => invoke('offline:import-catalog-delta', payload),
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

  appendActivityLog: (payload) => invoke('activity-log:append', payload || {}),
  listActivityLogs: () => invoke('activity-log:list'),
  readActivityLog: (filePath) => invoke('activity-log:read', filePath),
  openActivityLogFolder: () => invoke('activity-log:open-folder'),
  openActivityLogFile: (filePath) => invoke('activity-log:open-file', filePath),
  openActivityLogViewer: () => invoke('activity-log:open-viewer'),
  getActivityLogTodayPath: () => invoke('activity-log:today-path'),

  multikassaRequest: (payload) => invoke('desktop:multikassaRequest', payload),
  localDeviceRequest: (payload) => invoke('desktop:localDeviceRequest', payload),
});

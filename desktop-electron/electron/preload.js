const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

function readOfflineFirstFlag() {
  try {
    return Boolean(ipcRenderer.sendSync('desktop:get-offline-first-sync'));
  } catch {
    return false;
  }
}

function readRestaurantLocalFirstFlag() {
  try {
    return Boolean(ipcRenderer.sendSync('desktop:get-restaurant-local-first-sync'));
  } catch {
    return false;
  }
}

contextBridge.exposeInMainWorld('desktopCashier', {
  isDesktop: true,
  offlineFirst: readOfflineFirstFlag(),
  restaurantLocalFirst: readRestaurantLocalFirstFlag(),

  getApiBaseUrl: () => invoke('desktop:getApiBaseUrl'),
  getCompanyLoginCode: () => invoke('desktop:getCompanyLoginCode'),
  openServerSetup: () => invoke('desktop:open-server-setup'),
  setRestaurantLocalFirst: (enabled) => invoke('desktop:set-restaurant-local-first', Boolean(enabled)),
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
  printPlainEscpos: (payload) => invoke('desktop:print-plain-escpos', payload || {}),
  printZReportEscpos: (payload) => invoke('desktop:print-z-report-escpos', payload),
  printShiftReportEscpos: (payload) => invoke('desktop:print-shift-report-escpos', payload),
  printLabelsEscpos: (payload) => invoke('desktop:print-label-escpos', payload),
  printLabelPage: (opts) => invoke('print-label-page', opts || {}),
  printLabelTspl: (payload) => invoke('desktop:print-label-tspl', payload),
  labelTsplGetSettings: () => invoke('desktop:label-tspl-get-settings'),
  labelTsplSetSettings: (patch) => invoke('desktop:label-tspl-set-settings', patch),
  labelTsplAutoDetect: (opts) => invoke('desktop:label-tspl-auto-detect', opts || {}),

  rstOfflineGetStatus: () => invoke('rst-offline:get-status'),
  rstOfflineSetSession: (patch) => invoke('rst-offline:set-session', patch || {}),
  rstOfflineImportBootstrap: (payload) => invoke('rst-offline:import-bootstrap', payload || {}),
  rstOfflineSendToKitchen: (payload) => invoke('rst-offline:send-to-kitchen', payload || {}),
  rstOfflineOpenOrder: (payload) => invoke('rst-offline:open-order', payload || {}),
  rstOfflineAddItem: (payload) => invoke('rst-offline:add-item', payload || {}),
  rstOfflineUpdateItem: (payload) => invoke('rst-offline:update-item', payload || {}),
  rstOfflineCancelItem: (payload) => invoke('rst-offline:cancel-item', payload || {}),
  rstOfflineCancelOrder: (payload) => invoke('rst-offline:cancel-order', payload || {}),
  rstOfflinePayOrder: (payload) => invoke('rst-offline:pay-order', payload || {}),
  rstOfflineRequestBill: (payload) => invoke('rst-offline:request-bill', payload || {}),
  rstOfflineListMenu: (storeId) => invoke('rst-offline:list-menu', storeId),
  rstOfflineListCategories: (storeId) => invoke('rst-offline:list-categories', storeId),
  rstOfflineListRoster: (storeId) => invoke('rst-offline:list-roster', storeId),
  rstOfflineSaveModifiers: (payload) => invoke('rst-offline:save-modifiers', payload || {}),
  rstOfflineGetModifiers: (menuItemId) => invoke('rst-offline:get-modifiers', menuItemId),
  rstOfflineGetFloor: (storeId) => invoke('rst-offline:get-floor', storeId),
  rstOfflinePatchOrderMeta: (payload) => invoke('rst-offline:patch-order-meta', payload || {}),
  rstOfflineSaveShift: (payload) => invoke('rst-offline:save-shift', payload || {}),
  rstOfflineGetShift: (storeId) => invoke('rst-offline:get-shift', storeId),
  rstOfflineOpenShift: (payload) => invoke('rst-offline:open-shift', payload || {}),
  rstOfflineCloseShift: (payload) => invoke('rst-offline:close-shift', payload || {}),
  rstOfflineGetHubInfo: () => invoke('rst-offline:hub-info'),
  rstOfflineCreateMenuItem: (payload) => invoke('rst-offline:create-menu-item', payload || {}),
  rstOfflinePullHubSnapshot: (hubUrl) => invoke('rst-offline:pull-hub-snapshot', hubUrl),
  rstOfflineResolvePrintJob: (payload) => invoke('rst-offline:resolve-print-job', payload || {}),
  rstOfflineGetOrder: (orderId) => invoke('rst-offline:get-order', orderId),
  rstOfflineStartRuntime: () => invoke('rst-offline:start-runtime'),
  rstOfflineStopRuntime: () => invoke('rst-offline:stop-runtime'),

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

  appendActivityLog: (payload) => invoke('activity-log:append', payload || {}),
  listActivityLogs: () => invoke('activity-log:list'),
  readActivityLog: (filePath) => invoke('activity-log:read', filePath),
  openActivityLogFolder: () => invoke('activity-log:open-folder'),
  openActivityLogFile: (filePath) => invoke('activity-log:open-file', filePath),
  openActivityLogViewer: () => invoke('activity-log:open-viewer'),
  getActivityLogTodayPath: () => invoke('activity-log:today-path'),

  multikassaRequest: (payload) => invoke('desktop:multikassaRequest', payload),
});

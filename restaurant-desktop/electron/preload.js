const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

/**
 * Hall UI historically talks to window.desktopCashier (cashier shell names).
 * Keep aurentRestaurant for edge bootstrap; isDesktopCashier() still false
 * because it checks aurentRestaurant first.
 */
contextBridge.exposeInMainWorld('desktopCashier', {
  isDesktop: true,
  getCompanyLoginCode: () => invoke('desktop:getCompanyLoginCode'),
  reload: () => invoke('desktop:reload'),
  toggleFullscreen: () => invoke('desktop:toggleFullscreen'),
  quit: () => invoke('desktop:quit'),

  listPrinters: () => invoke('desktop:list-printers'),
  getPrinterSettings: () => invoke('desktop:get-printer-settings'),
  setPrinterSettings: (settings) => invoke('desktop:set-printer-settings', settings),
  printTicketHtml: (payload) => invoke('desktop:print-ticket-html', payload || {}),
  printReceiptEscpos: (payload) => invoke('desktop:print-receipt-escpos', payload),
  printPlainEscpos: (payload) => invoke('desktop:print-plain-escpos', payload || {}),
  printRaw: (payload) => invoke('desktop:print-raw', payload || {}),
  printZReportEscpos: (payload) => invoke('desktop:print-z-report-escpos', payload),
  printShiftReportEscpos: (payload) => invoke('desktop:print-shift-report-escpos', payload),

  checkForUpdates: () => invoke('desktop:checkForUpdates'),
  quitAndInstallUpdate: () => invoke('desktop:quitAndInstallUpdate'),
  onDesktopUpdate: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('desktop:update', handler);
    return () => ipcRenderer.removeListener('desktop:update', handler);
  },

  multikassaRequest: (payload) => invoke('desktop:multikassaRequest', payload),
});

contextBridge.exposeInMainWorld('aurentRestaurant', {
  isDesktop: true,
  getStatus: () => ipcRenderer.invoke('restaurant:get-status'),
  getEdgeAuthStatus: () => ipcRenderer.invoke('restaurant:get-edge-auth-status'),
  bootstrapStaffFromCloud: (payload) => ipcRenderer.invoke('restaurant:bootstrap-staff-from-cloud', payload),
  fetchCloudPinRoster: (companyLoginCode) => ipcRenderer.invoke('restaurant:fetch-cloud-pin-roster', companyLoginCode),
  ensureStaffViaCloudPin: (payload) => ipcRenderer.invoke('restaurant:ensure-staff-via-cloud-pin', payload),
  pushCloudSync: () => ipcRenderer.invoke('restaurant:push-cloud-sync'),
  getCompanyLoginCode: () => ipcRenderer.invoke('restaurant:get-company-login-code'),
  setCompanyLoginCode: (code) => ipcRenderer.invoke('restaurant:set-company-login-code', code),
  setMenuLocale: (locale) => ipcRenderer.invoke('restaurant:set-menu-locale', locale),
  onStatus: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on('restaurant:status', handler);
    return () => ipcRenderer.removeListener('restaurant:status', handler);
  },
  getLanHub: () => ipcRenderer.invoke('restaurant:get-lan-hub'),
});

const { contextBridge, ipcRenderer } = require('electron');

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
  onStatus: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on('restaurant:status', handler);
    return () => ipcRenderer.removeListener('restaurant:status', handler);
  },
});

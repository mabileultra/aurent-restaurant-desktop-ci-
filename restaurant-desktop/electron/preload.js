const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aurentRestaurant', {
  isDesktop: true,
  getStatus: () => ipcRenderer.invoke('restaurant:get-status'),
  getEdgeAuthStatus: () => ipcRenderer.invoke('restaurant:get-edge-auth-status'),
  bootstrapStaffFromCloud: (payload) => ipcRenderer.invoke('restaurant:bootstrap-staff-from-cloud', payload),
  pushCloudSync: () => ipcRenderer.invoke('restaurant:push-cloud-sync'),
  onStatus: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on('restaurant:status', handler);
    return () => ipcRenderer.removeListener('restaurant:status', handler);
  },
});

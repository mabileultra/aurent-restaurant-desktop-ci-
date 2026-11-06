const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('scalePicker', {
  load: () => ipcRenderer.invoke('scale-picker:load'),
  save: (payload) => ipcRenderer.invoke('scale-picker:save', payload),
  autoDetect: (payload) => ipcRenderer.invoke('scale-picker:auto-detect', payload || {}),
  testPort: (payload) => ipcRenderer.invoke('scale-picker:test', payload),
  testEthernet: (payload) => ipcRenderer.invoke('scale-picker:test-ethernet', payload),
  cancel: () => ipcRenderer.send('scale-picker:cancel'),
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('printerPicker', {
  load: (opts) => ipcRenderer.invoke('printer-picker:load', opts || {}),
  save: (name) => ipcRenderer.invoke('printer-picker:save', name),
  cancel: () => ipcRenderer.send('printer-picker:cancel'),
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('passwordApi', {
  submit: (password) => ipcRenderer.send('restaurant-setup-password:submit', password),
  cancel: () => ipcRenderer.send('restaurant-setup-password:cancel'),
});

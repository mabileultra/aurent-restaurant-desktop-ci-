const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('activityLogViewer', {
  list: () => invoke('activity-log:list'),
  read: (filePath) => invoke('activity-log:read', filePath),
  openFolder: () => invoke('activity-log:open-folder'),
  openFile: (filePath) => invoke('activity-log:open-file', filePath),
  todayPath: () => invoke('activity-log:today-path'),
  onRefresh: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = () => callback();
    ipcRenderer.on('activity-log:refresh', handler);
    return () => ipcRenderer.removeListener('activity-log:refresh', handler);
  },
});

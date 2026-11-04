const { BrowserWindow, ipcMain } = require('electron');
const {
  fetchUnreadDesktopNotifications,
  markDesktopNotificationRead,
} = require('./edgeDesktopNotifications');

function publishNotifications(payload) {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('restaurant:desktop-notifications', payload);
    }
  });
}

async function pollAndPublishDesktopNotifications() {
  const result = await fetchUnreadDesktopNotifications();
  if (result.skipped && !result.items?.length) {
    return result;
  }
  publishNotifications({
    items: result.items || [],
    unreadCount: result.unreadCount || 0,
    at: Date.now(),
  });
  return result;
}

function registerDesktopNotificationsIpc() {
  ipcMain.handle('restaurant:desktop-notifications-unread', async () => (
    pollAndPublishDesktopNotifications()
  ));
  ipcMain.handle('restaurant:desktop-notifications-mark-read', async (_e, id) => (
    markDesktopNotificationRead(id)
  ));
}

module.exports = {
  pollAndPublishDesktopNotifications,
  registerDesktopNotificationsIpc,
};

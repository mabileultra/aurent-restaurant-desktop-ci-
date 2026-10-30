const { shell, screen } = require('electron');

function guestDisplayBounds() {
  const displays = screen.getAllDisplays();
  const target = displays.length > 1
    ? displays.find((d) => d.id !== screen.getPrimaryDisplay().id) || displays[1]
    : screen.getPrimaryDisplay();
  return target?.bounds || { x: 0, y: 0, width: 1280, height: 800 };
}

/**
 * Same-origin popups (guest customer display) stay inside Electron,
 * fullscreen on the guest monitor when a second display exists.
 */
function createWindowOpenHandler(getMainWindow) {
  return ({ url }) => {
    try {
      const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
      const current = win && !win.isDestroyed() ? win.webContents.getURL() : '';
      if (current && new URL(url).origin === new URL(current).origin) {
        const bounds = guestDisplayBounds();
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            fullscreen: true,
            autoHideMenuBar: true,
            title: 'Aurent — экран покупателя',
          },
        };
      }
    } catch {
      /* fall through */
    }
    shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  };
}

module.exports = { createWindowOpenHandler };

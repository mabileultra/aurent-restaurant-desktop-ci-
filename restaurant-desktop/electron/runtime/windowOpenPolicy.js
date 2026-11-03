const { shell, screen } = require('electron');

function guestDisplayBounds() {
  const displays = screen.getAllDisplays();
  const target = displays.length > 1
    ? displays.find((d) => d.id !== screen.getPrimaryDisplay().id) || displays[1]
    : screen.getPrimaryDisplay();
  return {
    bounds: target?.bounds || { x: 0, y: 0, width: 1280, height: 800 },
    multiMonitor: displays.length > 1,
  };
}

function titleForUrl(url) {
  try {
    const path = new URL(url).pathname || '';
    if (path.includes('ready-display')) return 'Aurent — TV кухни';
    if (path.includes('customer-display')) return 'Aurent — экран покупателя';
  } catch {
    /* ignore */
  }
  return 'Aurent';
}

/**
 * Same-origin popups (guest CFD / kitchen TV) stay inside Electron,
 * fullscreen on the guest monitor when a second display exists.
 */
function createWindowOpenHandler(getMainWindow) {
  return ({ url }) => {
    try {
      const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
      const current = win && !win.isDestroyed() ? win.webContents.getURL() : '';
      if (current && new URL(url).origin === new URL(current).origin) {
        const { bounds, multiMonitor } = guestDisplayBounds();
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            fullscreen: multiMonitor,
            autoHideMenuBar: true,
            title: titleForUrl(url),
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

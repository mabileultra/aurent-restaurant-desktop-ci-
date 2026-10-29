const { shell } = require('electron');

/**
 * Same-origin popups (guest customer display) stay inside Electron.
 * External links open in the system browser.
 */
function createWindowOpenHandler(getMainWindow) {
  return ({ url }) => {
    try {
      const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
      const current = win && !win.isDestroyed() ? win.webContents.getURL() : '';
      if (current && new URL(url).origin === new URL(current).origin) {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            width: 1280,
            height: 800,
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

const { shell } = require('electron');

/**
 * Same-origin popups (guest customer display) stay inside Electron.
 * Everything else opens in the system browser.
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
    shell.openExternal(url);
    return { action: 'deny' };
  };
}

module.exports = { createWindowOpenHandler };

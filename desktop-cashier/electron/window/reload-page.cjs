/** Перезагрузка webContents без белой вспышки — фон окна совпадает с кассой. */

const CASHIER_BG_DARK = '#0c1018';

function applyCashierWindowBackground(mainWindow) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setBackgroundColor(CASHIER_BG_DARK);
}

function reloadWebContents(mainWindow) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return Promise.resolve({ ok: false });
  }
  const wc = mainWindow.webContents;
  applyCashierWindowBackground(mainWindow);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      wc.removeListener('did-fail-load', onFail);
      resolve({ ok });
    };

    const onFail = (_event, code) => {
      if (code === -3) return;
      finish(false);
    };

    const timer = setTimeout(() => finish(true), 20_000);

    wc.once('did-finish-load', () => finish(true));
    wc.once('did-fail-load', onFail);
    wc.reload();
  });
}

module.exports = { reloadWebContents, applyCashierWindowBackground, CASHIER_BG_DARK };

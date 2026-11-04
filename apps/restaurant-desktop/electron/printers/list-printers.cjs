const { getMainWindow } = require('./window-ref.cjs');

const LIST_TTL_MS = 10_000;
let listCache = { at: 0, printers: null, pending: null };

async function listSystemPrinters() {
  const now = Date.now();
  if (listCache.printers && now - listCache.at < LIST_TTL_MS) {
    return listCache.printers;
  }
  if (listCache.pending) return listCache.pending;
  listCache.pending = (async () => {
    const mainWindow = getMainWindow();
    const wc = mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents : null;
    if (!wc) {
      listCache = { at: Date.now(), printers: [], pending: null };
      return [];
    }
    try {
      const printers = await wc.getPrintersAsync();
      const next = Array.isArray(printers) ? printers : [];
      listCache = { at: Date.now(), printers: next, pending: null };
      return next;
    } catch {
      listCache = { at: Date.now(), printers: [], pending: null };
      return [];
    }
  })();
  return listCache.pending;
}

function invalidatePrinterListCache() {
  listCache = { at: 0, printers: null, pending: null };
}

module.exports = { listSystemPrinters, invalidatePrinterListCache };

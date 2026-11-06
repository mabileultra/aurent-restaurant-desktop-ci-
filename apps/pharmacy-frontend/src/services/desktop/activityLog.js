/** Desktop activity journal — everything important on the cashier shell. */

const CATEGORIES = new Set([
  'system',
  'connectivity',
  'catalog',
  'fiscal',
  'sale',
  'sync',
  'print',
  'auth',
  'shift',
  'api',
  'error',
  'local_first',
]);

function canLog() {
  return (
    typeof window !== 'undefined'
    && window.desktopCashier?.isDesktop === true
    && typeof window.desktopCashier.appendActivityLog === 'function'
  );
}

/**
 * @param {object} opts
 * @param {string} opts.category
 * @param {string} [opts.level]
 * @param {string} opts.message
 * @param {object} [opts.meta]
 */
export function logActivity({ category = 'system', level = 'info', message, meta } = {}) {
  if (!canLog() || !message) return;
  const safeCategory = CATEGORIES.has(category) ? category : 'system';
  Promise.resolve(
    window.desktopCashier.appendActivityLog({
      category: safeCategory,
      level,
      message: String(message),
      meta: meta || undefined,
      at: new Date().toISOString(),
    }),
  ).catch(() => {});
}

export function logConnectivity(message, meta, level = 'info') {
  logActivity({ category: 'connectivity', level, message, meta });
}

export function logCatalog(message, meta, level = 'info') {
  logActivity({ category: 'catalog', level, message, meta });
}

export function logFiscal(message, meta, level = 'info') {
  logActivity({ category: 'fiscal', level, message, meta });
}

export function logSale(message, meta, level = 'info') {
  logActivity({ category: 'sale', level, message, meta });
}

export function logSync(message, meta, level = 'info') {
  logActivity({ category: 'sync', level, message, meta });
}

export function logAuth(message, meta, level = 'info') {
  logActivity({ category: 'auth', level, message, meta });
}

export function logApi(message, meta, level = 'info') {
  logActivity({ category: 'api', level, message, meta });
}

export function logError(message, meta) {
  logActivity({ category: 'error', level: 'error', message, meta });
}

export async function openActivityLogViewer() {
  if (!canLog() || typeof window.desktopCashier.openActivityLogViewer !== 'function') {
    return { ok: false };
  }
  return window.desktopCashier.openActivityLogViewer();
}

/** Desktop activity journal — restaurant shell (online + local-first). */

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

export function logLocalFirst(message, meta, level = 'info') {
  logActivity({ category: 'local_first', level, message, meta });
}

export function logPrint(message, meta, level = 'info') {
  logActivity({ category: 'print', level, message, meta });
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

export async function openActivityLogFolder() {
  if (!canLog() || typeof window.desktopCashier.openActivityLogFolder !== 'function') {
    return { ok: false };
  }
  return window.desktopCashier.openActivityLogFolder();
}

/**
 * URL фида electron-updater: всегда с backendOrigin сервера, не с localhost UI.
 */

function normalizeOrigin(url) {
  const raw = String(url || '').trim().replace(/\/$/, '');
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!parsed.protocol || parsed.protocol === 'file:') return null;
    if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function normalizeFeedBase(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  if (raw.includes('127.0.0.1') || raw.includes('localhost')) return null;
  return raw.endsWith('/') ? raw : `${raw}/`;
}

/**
 * @param {{ backendOrigin?: string, cashierUrl?: string, updateFeedUrl?: string }} config
 * @returns {string|null}
 */
function buildUpdateFeedUrl(config = {}) {
  const explicit = normalizeFeedBase(config.updateFeedUrl);
  if (explicit) return explicit;

  const origin = normalizeOrigin(config.backendOrigin) || normalizeOrigin(config.cashierUrl);
  if (!origin) return null;

  return `${origin}/downloads/desktop/`;
}

module.exports = {
  buildUpdateFeedUrl,
  normalizeOrigin,
};

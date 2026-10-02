/** D1 — exponential backoff for outbox RETRY. Pure, no I/O. */

const BASE_MS = 1_000;
const MAX_MS = 5 * 60_000;

/**
 * @param {number} attemptCount — after this failed send (1-based once SENDING bumped)
 * @returns {number} delay ms until next_retry_at
 */
function outboxBackoffMs(attemptCount) {
  const n = Math.max(1, Number(attemptCount) || 1);
  const exp = Math.min(MAX_MS, BASE_MS * (2 ** Math.min(n - 1, 10)));
  return exp;
}

/**
 * @param {string} nowIso
 * @param {number} attemptCount
 * @returns {string} ISO next_retry_at
 */
function nextRetryAtIso(nowIso, attemptCount) {
  const start = Date.parse(nowIso);
  const at = (Number.isFinite(start) ? start : Date.now()) + outboxBackoffMs(attemptCount);
  return new Date(at).toISOString();
}

module.exports = {
  BASE_MS,
  MAX_MS,
  outboxBackoffMs,
  nextRetryAtIso,
};

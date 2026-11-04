/** Fail-fast after upstream DNS/connect errors so offline UI is not flooded. */

const DEFAULT_COOLDOWN_MS = 8_000;
const LOG_EVERY_MS = 5_000;

let blockedUntil = 0;
let lastLogAt = 0;
let suppressed = 0;

function isUpstreamDownError(err) {
  const code = err?.code || '';
  const msg = String(err?.message || err || '');
  return (
    code === 'ENOTFOUND'
    || code === 'EAI_AGAIN'
    || code === 'ECONNREFUSED'
    || code === 'ENETUNREACH'
    || code === 'EHOSTUNREACH'
    || code === 'ETIMEDOUT'
    || /ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ENETUNREACH|EHOSTUNREACH|ETIMEDOUT/i.test(msg)
  );
}

function isCircuitOpen(now = Date.now()) {
  return now < blockedUntil;
}

function noteUpstreamFailure(err, { cooldownMs = DEFAULT_COOLDOWN_MS } = {}) {
  if (!isUpstreamDownError(err)) return { open: false, shouldLog: true };
  const now = Date.now();
  blockedUntil = Math.max(blockedUntil, now + cooldownMs);
  if (now - lastLogAt >= LOG_EVERY_MS) {
    const extra = suppressed > 0 ? ` (+${suppressed} suppressed)` : '';
    suppressed = 0;
    lastLogAt = now;
    return { open: true, shouldLog: true, extra };
  }
  suppressed += 1;
  return { open: true, shouldLog: false, extra: '' };
}

function noteUpstreamSuccess() {
  blockedUntil = 0;
  suppressed = 0;
}

function resetCircuitForTests() {
  blockedUntil = 0;
  lastLogAt = 0;
  suppressed = 0;
}

module.exports = {
  isUpstreamDownError,
  isCircuitOpen,
  noteUpstreamFailure,
  noteUpstreamSuccess,
  resetCircuitForTests,
  DEFAULT_COOLDOWN_MS,
};

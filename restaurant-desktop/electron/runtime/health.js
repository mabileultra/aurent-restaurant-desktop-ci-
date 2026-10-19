const http = require('http');
const https = require('https');

function probeHealth(url, timeoutMs = 2000) {
  return new Promise((resolve) => {
    try {
      const lib = String(url).startsWith('https') ? https : http;
      const req = lib.get(url, { timeout: timeoutMs }, (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          const ok = res.statusCode >= 200 && res.statusCode < 300;
          resolve({ ok, status: res.statusCode, body: body.slice(0, 200) });
        });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'timeout' });
      });
      req.on('error', (err) => resolve({ ok: false, error: err.message }));
    } catch (err) {
      resolve({ ok: false, error: err.message });
    }
  });
}

async function waitForHealth(url, {
  timeoutMs = 90_000,
  intervalMs = 1000,
  onProgress = null,
} = {}) {
  const started = Date.now();
  let lastProgressAt = 0;
  while (Date.now() - started < timeoutMs) {
    const hit = await probeHealth(url);
    if (hit.ok) return hit;
    const elapsed = Date.now() - started;
    if (typeof onProgress === 'function' && elapsed - lastProgressAt >= 5_000) {
      lastProgressAt = elapsed;
      onProgress({
        elapsedMs: elapsed,
        remainingMs: Math.max(0, timeoutMs - elapsed),
        lastError: hit.error || `HTTP ${hit.status || '?'}`,
      });
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`restaurant-service health timeout: ${url}`);
}

module.exports = { probeHealth, waitForHealth };

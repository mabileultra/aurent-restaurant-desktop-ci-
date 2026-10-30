const http = require('http');
const { SERVICE_HOST, SERVICE_PORT } = require('../config');

function getOutboxCounts() {
  return new Promise((resolve) => {
    const req = http.get(
      `http://${SERVICE_HOST}:${SERVICE_PORT}/api/v1/edge/sync/status`,
      { timeout: 8000 },
      (res) => {
        let raw = '';
        res.on('data', (c) => { raw += c; });
        res.on('end', () => {
          try {
            const j = JSON.parse(raw);
            resolve({
              pending: Number(j.pending || 0),
              failed: Number(j.failed || 0),
              cloudConfigured: Boolean(j.cloudConfigured),
            });
          } catch {
            resolve({ pending: 0, failed: 0, cloudConfigured: false });
          }
        });
      },
    );
    req.on('error', () => resolve({ pending: 0, failed: 0, cloudConfigured: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ pending: 0, failed: 0, cloudConfigured: false });
    });
  });
}

function postSyncPush() {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: SERVICE_HOST,
        port: SERVICE_PORT,
        path: '/api/v1/edge/sync/push',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 60_000,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => { raw += c; });
        res.on('end', () => {
          try {
            resolve(raw ? JSON.parse(raw) : { pushed: 0 });
          } catch {
            resolve({ pushed: 0 });
          }
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('sync push timeout'));
    });
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Quiet outbox drain — no UI (Phase I).
 * More rounds on reconnect; short pause between batches; stop on empty or hard stall.
 */
async function flushEdgeOutbox({ maxRounds = 5, pauseMs = 200 } = {}) {
  let totalPushed = 0;
  let last = { pending: 0, failed: 0, cloudConfigured: false };
  let stallRounds = 0;

  for (let i = 0; i < maxRounds; i += 1) {
    last = await getOutboxCounts();
    if (!last.cloudConfigured && last.pending + last.failed <= 0) break;
    const queue = last.pending + last.failed;
    if (queue <= 0) break;

    let res;
    try {
      res = await postSyncPush();
    } catch (err) {
      return {
        pushed: totalPushed,
        pending: last.pending,
        failed: last.failed,
        error: err.message || String(err),
      };
    }

    const n = Number(res?.pushed || 0);
    totalPushed += n;
    if (res?.error && n <= 0) {
      stallRounds += 1;
      if (stallRounds >= 2) break;
      await sleep(Math.min(1500, pauseMs * 4));
      continue;
    }
    if (n <= 0) {
      stallRounds += 1;
      if (stallRounds >= 2) break;
      await sleep(pauseMs);
      continue;
    }
    stallRounds = 0;
    if (i + 1 < maxRounds) await sleep(pauseMs);
  }

  last = await getOutboxCounts();
  return {
    pushed: totalPushed,
    pending: last.pending,
    failed: last.failed,
    cloudConfigured: last.cloudConfigured,
  };
}

module.exports = { getOutboxCounts, flushEdgeOutbox };

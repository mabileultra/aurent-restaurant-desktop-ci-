const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Mirrors edgePostgres.run timeout kill behavior without loading Electron.
 */
function runWithTimeout(bin, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        /* ignore */
      }
      finish(reject, new Error(`${path.basename(bin)} timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);
    child.on('error', (err) => finish(reject, err));
    child.on('close', (code) => {
      if (code === 0) finish(resolve, '');
      else finish(reject, new Error(`exit ${code}`));
    });
  });
}

describe('spawn run timeout', () => {
  it('kills a hung process and rejects', async () => {
    const started = Date.now();
    await assert.rejects(
      () => runWithTimeout(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], 800),
      /timed out after/
    );
    assert.ok(Date.now() - started < 5_000, 'must not hang forever');
  });
});

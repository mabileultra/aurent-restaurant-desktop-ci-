const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { waitForHealth } = require('../electron/runtime/health');

describe('waitForHealth', () => {
  it('reports progress while waiting then succeeds', async () => {
    let hits = 0;
    const server = http.createServer((_req, res) => {
      hits += 1;
      if (hits < 3) {
        res.writeHead(503);
        res.end('starting');
        return;
      }
      res.writeHead(200);
      res.end('{"status":"UP"}');
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const { port } = server.address();
    const progress = [];
    const hit = await waitForHealth(`http://127.0.0.1:${port}/h`, {
      timeoutMs: 15_000,
      intervalMs: 200,
      onProgress: (p) => progress.push(p.elapsedMs),
    });
    server.close();
    assert.equal(hit.ok, true);
  });

  it('times out with clear error', async () => {
    await assert.rejects(
      () => waitForHealth('http://127.0.0.1:59998/nope', {
        timeoutMs: 800,
        intervalMs: 200,
      }),
      /health timeout/
    );
  });
});

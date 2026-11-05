const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { startLocalUiServer } = require('../electron/ui/localUiServer');
const { safeJoin } = require('../electron/ui/staticHandler');
const { isApiRequest } = require('../electron/ui/apiProxy');

test('isApiRequest only matches /api', () => {
  assert.equal(isApiRequest('/api/v1/health'), true);
  assert.equal(isApiRequest('/cashier/login'), false);
});

test('safeJoin blocks path traversal', () => {
  const root = path.join(os.tmpdir(), 'aurent-ui-root');
  fs.mkdirSync(root, { recursive: true });
  assert.equal(safeJoin(root, '/index.html')?.startsWith(path.resolve(root)), true);
  assert.equal(safeJoin(root, '/../secret.txt'), null);
});

test('local UI server serves index and proxies API', async () => {
  const uiRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'aurent-ui-'));
  fs.writeFileSync(path.join(uiRoot, 'index.html'), '<html>cashier</html>');

  const backend = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, path: req.url }));
  });
  await new Promise((resolve) => backend.listen(0, '127.0.0.1', resolve));
  const backendPort = backend.address().port;

  const server = await startLocalUiServer({
    uiRoot,
    backendOrigin: `http://127.0.0.1:${backendPort}`,
  });

  try {
    const page = await fetch(`${server.origin}/cashier/login`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /cashier/);

    const api = await fetch(`${server.origin}/api/v1/actuator/health`);
    assert.equal(api.status, 200);
    const body = await api.json();
    assert.equal(body.ok, true);
    assert.equal(body.path, '/api/v1/actuator/health');
  } finally {
    await server.close();
    await new Promise((resolve) => backend.close(resolve));
  }
});

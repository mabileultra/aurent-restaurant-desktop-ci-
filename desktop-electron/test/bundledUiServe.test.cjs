const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startLocalUiServer } = require('../electron/ui/localUiServer');

const uiRoot = path.join(__dirname, '..', 'ui');
const hasBundledUi = fs.existsSync(path.join(uiRoot, 'index.html'));

test('bundled UI folder serves cashier login and index chunk', { skip: !hasBundledUi }, async () => {
  const server = await startLocalUiServer({
    uiRoot,
    backendOrigin: 'https://example.invalid',
  });
  try {
    const login = await fetch(`${server.origin}/cashier/login`);
    assert.equal(login.status, 200);
    const html = await login.text();
    assert.match(html, /id="root"/);
    const asset = html.match(/\/assets\/index-[^"]+\.js/);
    assert.ok(asset, 'index chunk not found in html');
    const js = await fetch(`${server.origin}${asset[0]}`);
    assert.equal(js.status, 200);
    assert.match(String(js.headers.get('content-type') || ''), /javascript/);
  } finally {
    await server.close();
  }
});

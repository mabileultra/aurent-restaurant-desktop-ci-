const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveCashierStartUrl } = require('../electron/ui/resolveCashierStartUrl');
const { UI_MODE_BUNDLED, UI_MODE_REMOTE } = require('../electron/config/uiMode');

const cfg = {
  cashierUrl: 'https://aurent.uz',
  backendOrigin: 'https://aurent.uz',
  companyLoginCode: '10001',
  uiMode: UI_MODE_REMOTE,
};

test('remote mode never starts local UI server', async () => {
  let started = false;
  const result = await resolveCashierStartUrl({
    cfg,
    bundledRoot: '/tmp/ui',
    startServer: async () => {
      started = true;
    },
    stopServer: async () => {},
  });
  assert.equal(started, false);
  assert.equal(result.source, 'remote');
  assert.equal(result.url, 'https://aurent.uz/cashier/login?companyLoginCode=10001');
});

test('bundled without files falls back to remote', async () => {
  const result = await resolveCashierStartUrl({
    cfg: { ...cfg, uiMode: UI_MODE_BUNDLED },
    bundledRoot: null,
    startServer: async () => {
      throw new Error('should not start');
    },
    stopServer: async () => {},
  });
  assert.equal(result.source, 'remote-fallback');
  assert.equal(result.reason, 'ui_missing');
  assert.match(result.url, /aurent\.uz\/cashier\/login/);
});

test('bundled with files uses local origin', async () => {
  const result = await resolveCashierStartUrl({
    cfg: { ...cfg, uiMode: UI_MODE_BUNDLED },
    bundledRoot: '/ui',
    startServer: async ({ uiRoot, backendOrigin }) => ({
      origin: 'http://127.0.0.1:47811',
      uiRoot,
      backendOrigin,
    }),
    stopServer: async () => {},
  });
  assert.equal(result.source, 'bundled');
  assert.equal(result.url, 'http://127.0.0.1:47811/cashier/login?companyLoginCode=10001');
});

test('restaurant world default stays remote even if uiMode bundled', async () => {
  let started = false;
  const result = await resolveCashierStartUrl({
    cfg: {
      ...cfg,
      appWorld: 'restaurant',
      restaurantUrl: 'https://r-aurent.uz',
      uiMode: UI_MODE_BUNDLED,
    },
    bundledRoot: '/ui',
    startServer: async () => {
      started = true;
      return { origin: 'http://127.0.0.1:9' };
    },
    stopServer: async () => {},
    env: {},
  });
  assert.equal(started, false);
  assert.equal(result.source, 'remote');
  assert.equal(result.reason, 'restaurant_world');
  assert.equal(result.url, 'https://r-aurent.uz/cashier/login?companyLoginCode=10001');
});

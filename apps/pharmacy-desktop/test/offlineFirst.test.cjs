const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveOfflineFirst } = require('../electron/config/offlineFirst');

test('offlineFirst defaults to false for existing cashiers', () => {
  assert.equal(resolveOfflineFirst({ userConfig: {}, env: {} }), false);
  assert.equal(resolveOfflineFirst({ userConfig: null, env: {} }), false);
});

test('offlineFirst enables only when explicitly set', () => {
  assert.equal(resolveOfflineFirst({ userConfig: { offlineFirst: true }, env: {} }), true);
  assert.equal(resolveOfflineFirst({ userConfig: {}, env: { AURENT_OFFLINE_FIRST: '1' } }), true);
});

test('AURENT_OFFLINE_FIRST=0 overrides user true', () => {
  assert.equal(
    resolveOfflineFirst({
      userConfig: { offlineFirst: true },
      env: { AURENT_OFFLINE_FIRST: '0' },
    }),
    false,
  );
});

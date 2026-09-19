const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveOfflineEngine, ENGINE_SQLJS, ENGINE_NATIVE } = require('../electron/offline/engine/offlineEngine');

test('offline engine defaults to sql.js for existing cashiers', () => {
  assert.equal(resolveOfflineEngine({ userConfig: {}, env: {} }), ENGINE_SQLJS);
  assert.equal(resolveOfflineEngine({ userConfig: null, env: {} }), ENGINE_SQLJS);
});

test('offline engine native only when explicitly set', () => {
  assert.equal(resolveOfflineEngine({ userConfig: { offlineEngine: 'native' }, env: {} }), ENGINE_NATIVE);
  assert.equal(
    resolveOfflineEngine({ userConfig: {}, env: { AURENT_OFFLINE_ENGINE: 'native' } }),
    ENGINE_NATIVE,
  );
});

test('AURENT_OFFLINE_ENGINE=sqljs overrides user native', () => {
  assert.equal(
    resolveOfflineEngine({
      userConfig: { offlineEngine: 'native' },
      env: { AURENT_OFFLINE_ENGINE: 'sqljs' },
    }),
    ENGINE_SQLJS,
  );
});

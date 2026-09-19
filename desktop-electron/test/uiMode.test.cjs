const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveUiMode, UI_MODE_REMOTE, UI_MODE_BUNDLED } = require('../electron/config/uiMode');

test('uiMode defaults to remote for existing cashiers', () => {
  assert.equal(resolveUiMode({ userConfig: {}, env: {} }), UI_MODE_REMOTE);
  assert.equal(resolveUiMode({ userConfig: null, env: {} }), UI_MODE_REMOTE);
  assert.equal(resolveUiMode({ userConfig: { useRemoteUi: true }, env: {} }), UI_MODE_REMOTE);
});

test('uiMode bundled only when explicitly set', () => {
  assert.equal(resolveUiMode({ userConfig: { uiMode: 'bundled' }, env: {} }), UI_MODE_BUNDLED);
  assert.equal(resolveUiMode({ userConfig: { useRemoteUi: false }, env: {} }), UI_MODE_BUNDLED);
});

test('AURENT_UI_MODE overrides user config', () => {
  assert.equal(
    resolveUiMode({ userConfig: { uiMode: 'bundled' }, env: { AURENT_UI_MODE: 'remote' } }),
    UI_MODE_REMOTE,
  );
});

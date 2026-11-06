/** Режим UI кассы. По умолчанию remote — как у всех клиентов сейчас. */

const UI_MODE_REMOTE = 'remote';
const UI_MODE_BUNDLED = 'bundled';

function normalizeUiMode(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (value === UI_MODE_BUNDLED || value === 'local' || value === 'embedded') {
    return UI_MODE_BUNDLED;
  }
  if (value === UI_MODE_REMOTE || value === 'site' || value === 'online') {
    return UI_MODE_REMOTE;
  }
  return '';
}

function resolveUiMode({ userConfig, env = process.env } = {}) {
  const fromEnv = normalizeUiMode(env?.AURENT_UI_MODE);
  if (fromEnv) return fromEnv;

  const fromUser = normalizeUiMode(userConfig?.uiMode);
  if (fromUser) return fromUser;

  if (userConfig?.useRemoteUi === false) return UI_MODE_BUNDLED;
  return UI_MODE_REMOTE;
}

function isBundledUiMode(mode) {
  return mode === UI_MODE_BUNDLED;
}

module.exports = {
  UI_MODE_REMOTE,
  UI_MODE_BUNDLED,
  normalizeUiMode,
  resolveUiMode,
  isBundledUiMode,
};

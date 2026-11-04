/** Pure feed URL resolution for electron-updater (no Electron imports). */

const { DESKTOP_UPDATE_FEED } = require('../config/publicUrl');

function resolveFeedUrl(_webUrl, env = process.env) {
  if (env?.AURENT_UPDATE_URL) {
    const url = String(env.AURENT_UPDATE_URL).trim();
    return url.endsWith('/') ? url : `${url}/`;
  }
  // Pharmacy installers: aurent.uz/downloads/pharmacy-desktop/ (not p-aurent SPA origin).
  return DESKTOP_UPDATE_FEED;
}

module.exports = { resolveFeedUrl, DESKTOP_UPDATE_FEED };

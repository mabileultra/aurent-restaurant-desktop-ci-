/** Pure feed URL resolution for electron-updater (no Electron imports). */

const { DESKTOP_UPDATE_FEED } = require('../config/publicUrl');

function resolveFeedUrl(webUrl, env = process.env) {
  if (env?.AURENT_UPDATE_URL) {
    const url = String(env.AURENT_UPDATE_URL).trim();
    return url.endsWith('/') ? url : `${url}/`;
  }
  // Desktop installers live on the main site only (aurent.uz/downloads/desktop/).
  // Restaurant UI (r-aurent.uz) must NOT become the feed origin — that 404s and
  // updates never arrive on restaurant cashiers.
  void webUrl;
  return DESKTOP_UPDATE_FEED;
}

module.exports = { resolveFeedUrl, DESKTOP_UPDATE_FEED };

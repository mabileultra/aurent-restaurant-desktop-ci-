const RESTAURANT_DESKTOP_UPDATE_FEED = 'https://r-aurent.uz/downloads/restaurant-desktop/';

function resolveFeedUrl(env = process.env) {
  if (env?.AURENT_RESTAURANT_UPDATE_URL) {
    const url = String(env.AURENT_RESTAURANT_UPDATE_URL).trim();
    return url.endsWith('/') ? url : `${url}/`;
  }
  return RESTAURANT_DESKTOP_UPDATE_FEED;
}

module.exports = { resolveFeedUrl, RESTAURANT_DESKTOP_UPDATE_FEED };

const { PRODUCTION_ORIGIN } = require('./publicUrl');

/** Default restaurant SPA origin (PIN handoff target when split is enabled). */
const PRODUCTION_RESTAURANT_ORIGIN = 'https://r-aurent.uz';

const DEV_WEB_URL = 'http://localhost:5173/cashier/login';
const DEV_API_URL = 'http://localhost:8080/api/v1';
const DEV_RESTAURANT_URL = 'http://localhost:5174';

function resolveDesktopUrls({ isPackaged }) {
  const productionWeb = `${PRODUCTION_ORIGIN}/cashier/login`;
  const productionApi = `${PRODUCTION_ORIGIN}/api/v1`;

  return {
    webUrl:
      process.env.AURENT_WEB_URL ||
      process.env.VITE_DEV_URL ||
      (isPackaged ? productionWeb : DEV_WEB_URL),
    apiUrl: process.env.AURENT_API_URL || (isPackaged ? productionApi : DEV_API_URL),
    restaurantUrl:
      process.env.AURENT_RESTAURANT_WEB_URL ||
      (isPackaged ? PRODUCTION_RESTAURANT_ORIGIN : DEV_RESTAURANT_URL),
  };
}

module.exports = {
  resolveDesktopUrls,
  DEV_WEB_URL,
  DEV_API_URL,
  DEV_RESTAURANT_URL,
  PRODUCTION_RESTAURANT_ORIGIN,
};

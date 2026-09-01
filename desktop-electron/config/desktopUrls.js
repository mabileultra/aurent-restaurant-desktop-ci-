const { PRODUCTION_ORIGIN } = require('./publicUrl');

const DEV_WEB_URL = 'http://localhost:5173/cashier/login';
const DEV_API_URL = 'http://localhost:8080/api/v1';

function resolveDesktopUrls({ isPackaged }) {
  const productionWeb = `${PRODUCTION_ORIGIN}/cashier/login`;
  const productionApi = `${PRODUCTION_ORIGIN}/api/v1`;

  return {
    webUrl:
      process.env.AURENT_WEB_URL ||
      process.env.VITE_DEV_URL ||
      (isPackaged ? productionWeb : DEV_WEB_URL),
    apiUrl: process.env.AURENT_API_URL || (isPackaged ? productionApi : DEV_API_URL),
  };
}

module.exports = { resolveDesktopUrls, DEV_WEB_URL, DEV_API_URL };

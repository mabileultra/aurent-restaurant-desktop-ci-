const fs = require('fs');
const path = require('path');
const { startLocalUiServer } = require('../electron/ui/localUiServer');

const desktopRoot = path.join(__dirname, '..');
const uiRoot = path.join(desktopRoot, 'ui');
const api = process.env.AURENT_API_URL || 'http://127.0.0.1:8080/api/v1';
const backendOrigin = String(api).replace(/\/api\/v1\/?$/, '');

if (!fs.existsSync(path.join(uiRoot, 'index.html'))) {
  console.error('No bundled UI. Run: npm run bundle-ui');
  process.exit(1);
}

startLocalUiServer({ uiRoot, backendOrigin })
  .then((server) => {
    const login = `${server.origin}/cashier/login`;
    console.log(login);
    const keepAlive = process.env.AURENT_KEEP_UI_SERVER === '1';
    if (!keepAlive) {
      return server.close();
    }
    process.on('SIGINT', () => {
      server.close().then(() => process.exit(0));
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

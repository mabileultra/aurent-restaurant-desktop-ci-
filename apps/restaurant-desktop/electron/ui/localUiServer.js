const http = require('http');
const { isApiRequest, proxyApiRequest } = require('./apiProxy');
const { serveStatic } = require('./staticHandler');

function startLocalUiServer({ uiRoot, backendOrigin, host = '127.0.0.1', port = 0 } = {}) {
  if (!uiRoot) {
    return Promise.reject(new Error('bundled ui root is missing'));
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (isApiRequest(req.url)) {
        proxyApiRequest(req, res, backendOrigin);
        return;
      }
      serveStatic(req, res, uiRoot);
    });

    server.once('error', reject);
    server.listen(port, host, () => {
      const address = server.address();
      const actualPort = address && typeof address === 'object' ? address.port : port;
      const origin = `http://${host}:${actualPort}`;
      resolve({
        origin,
        host,
        port: actualPort,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

module.exports = { startLocalUiServer };

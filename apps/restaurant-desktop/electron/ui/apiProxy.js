const http = require('http');
const https = require('https');
const { URL } = require('url');

function isApiRequest(urlPath) {
  const p = String(urlPath || '');
  return p.startsWith('/api/') || p.startsWith('/api?');
}

/** backendOrigin example: http://127.0.0.1:8087 (service root; paths include /api/v1/...) */
function proxyApiRequest(req, res, backendOrigin) {
  try {
    const origin = new URL(backendOrigin);
    const pathAndQuery = req.url || '/';
    const lib = origin.protocol === 'https:' ? https : http;
    const headers = { ...req.headers, host: origin.host };

    const proxyReq = lib.request(
      {
        protocol: origin.protocol,
        hostname: origin.hostname,
        port: origin.port || (origin.protocol === 'https:' ? 443 : 80),
        method: req.method,
        path: pathAndQuery,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );
    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'local restaurant-service unavailable', detail: err.message }));
    });
    req.pipe(proxyReq);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: String(err.message || err) }));
  }
}

module.exports = { isApiRequest, proxyApiRequest };

const http = require('http');
const https = require('https');

function isApiRequest(url) {
  const pathOnly = String(url || '').split('?')[0];
  return pathOnly === '/api' || pathOnly.startsWith('/api/');
}

function proxyApiRequest(req, res, backendOrigin) {
  const origin = String(backendOrigin || '').replace(/\/$/, '');
  if (!origin) {
    res.writeHead(502);
    res.end('API origin is not configured');
    return;
  }

  let dest;
  try {
    dest = new URL(`${origin}${req.url}`);
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }

  const headers = { ...req.headers, host: dest.host };
  delete headers['accept-encoding'];

  const lib = dest.protocol === 'https:' ? https : http;
  const upstream = lib.request(
    {
      protocol: dest.protocol,
      hostname: dest.hostname,
      port: dest.port || (dest.protocol === 'https:' ? 443 : 80),
      path: `${dest.pathname}${dest.search}`,
      method: req.method,
      headers,
    },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);
    },
  );

  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(upstream);
}

module.exports = { isApiRequest, proxyApiRequest };

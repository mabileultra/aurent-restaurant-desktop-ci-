const http = require('http');
const https = require('https');
const {
  isCircuitOpen,
  noteUpstreamFailure,
  noteUpstreamSuccess,
} = require('./apiProxyCircuit');

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'host',
  'accept-encoding',
]);

function isApiRequest(url) {
  const pathOnly = String(url || '').split('?')[0];
  return pathOnly === '/api' || pathOnly.startsWith('/api/');
}

function filterHeaders(source) {
  const out = {};
  if (!source) return out;
  for (const [key, value] of Object.entries(source)) {
    if (value == null) continue;
    if (HOP_BY_HOP.has(String(key).toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}

function writeBadGateway(res, message = 'Bad Gateway') {
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
  }
  res.end(message);
}

function proxyApiRequest(req, res, backendOrigin) {
  const origin = String(backendOrigin || '').replace(/\/$/, '');
  if (!origin) {
    writeBadGateway(res, 'API origin is not configured');
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

  if (isCircuitOpen()) {
    writeBadGateway(res, 'Bad Gateway');
    return;
  }

  const headers = filterHeaders(req.headers);
  headers.host = dest.host;

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
      noteUpstreamSuccess();
      const outHeaders = filterHeaders(up.headers);
      res.writeHead(up.statusCode || 502, outHeaders);
      up.pipe(res);
    },
  );

  upstream.on('error', (err) => {
    const { shouldLog, extra } = noteUpstreamFailure(err);
    if (shouldLog) {
      console.error('[api-proxy]', dest.href, err?.message || err, extra || '');
    }
    writeBadGateway(res);
  });

  req.pipe(upstream);
}

module.exports = { isApiRequest, proxyApiRequest, filterHeaders };

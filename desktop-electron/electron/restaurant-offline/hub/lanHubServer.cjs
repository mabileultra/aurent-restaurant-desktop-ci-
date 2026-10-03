/**
 * LAN hub — phone/waiter posts local-events to this station when cloud is down.
 * Applies into SQLite + local print (same commands as UI).
 */
const http = require('node:http');
const { networkInterfaces } = require('node:os');

const DEFAULT_PORT = 8787;

function pickLanIpv4() {
  const nets = networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const net of entries || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * @param {object} opts
 * @param {() => Promise<object>} [opts.getDb]
 * @param {(event: object) => Promise<object>} opts.applyEvent
 * @param {() => object} opts.getMeta — { storeId, deviceId }
 * @param {() => Promise<object>|object} [opts.getSnapshot]
 * @param {number} [opts.port]
 */
function createLanHubServer(opts) {
  const port = Number(opts.port) || DEFAULT_PORT;
  let server = null;
  let listening = false;

  async function handleEvent(body) {
    const eventType = String(body.eventType || '').trim();
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
    const clientEventId = body.clientEventId || null;
    const deviceId = String(body.deviceId || 'hub-client').trim();
    return opts.applyEvent({
      eventType,
      payload,
      clientEventId,
      deviceId,
    });
  }

  const app = http.createServer(async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    try {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      if (req.method === 'GET' && url.pathname === '/hub/health') {
        const meta = opts.getMeta() || {};
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          service: 'pos-rst-hub',
          storeId: meta.storeId ?? null,
          deviceId: meta.deviceId ?? null,
          lanIp: pickLanIpv4(),
          port,
        }));
        return;
      }
      if (req.method === 'GET' && url.pathname === '/hub/snapshot') {
        if (typeof opts.getSnapshot !== 'function') {
          res.writeHead(501, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'snapshot_unavailable' }));
          return;
        }
        const snap = await opts.getSnapshot();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(snap || { storeId: null, orders: [], floor: { halls: [] } }));
        return;
      }
      if (req.method === 'POST' && (url.pathname === '/hub/events' || url.pathname === '/hub/local-events')) {
        const body = await readBody(req);
        const result = await handleEvent(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          outcome: result?.outcome || 'ACCEPTED',
          ...result,
        }));
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not_found' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(err?.message || err) }));
    }
  });

  function start() {
    if (listening) return Promise.resolve(getInfo());
    return new Promise((resolve, reject) => {
      server = app.listen(port, '0.0.0.0', () => {
        listening = true;
        resolve(getInfo());
      });
      server.on('error', reject);
    });
  }

  function stop() {
    return new Promise((resolve) => {
      if (!server) {
        listening = false;
        resolve();
        return;
      }
      server.close(() => {
        listening = false;
        server = null;
        resolve();
      });
    });
  }

  function getInfo() {
    const ip = pickLanIpv4();
    return {
      listening,
      port,
      lanIp: ip,
      url: `http://${ip}:${port}`,
      healthUrl: `http://${ip}:${port}/hub/health`,
    };
  }

  return { start, stop, getInfo };
}

module.exports = { createLanHubServer, pickLanIpv4, DEFAULT_PORT };

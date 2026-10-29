const http = require('http');
const https = require('https');
const { URL } = require('url');
const { SERVICE_HOST, SERVICE_PORT } = require('../config');

const DEFAULT_CLOUD_API = 'https://r-aurent.uz/api/v1';

function requestJson(url, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const payload = body == null ? null : JSON.stringify(body);
    const req = lib.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: `${u.pathname}${u.search}`,
        method,
        headers: {
          Accept: 'application/json',
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let data = null;
          try {
            data = raw ? JSON.parse(raw) : null;
          } catch {
            data = { raw };
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data });
          } else {
            const err = new Error(data?.message || `HTTP ${res.statusCode}`);
            err.status = res.statusCode;
            err.data = data;
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function localBase() {
  return `http://${SERVICE_HOST}:${SERVICE_PORT}/api/v1`;
}

function cloudBase() {
  const raw = process.env.RESTAURANT_CLOUD_API_URL
    || process.env.RESTAURANT_CLOUD_SYNC_URL
    || '';
  // Never use relative VITE_API_URL (/api/v1) — that would hit localhost, not the cloud.
  const candidate = String(raw || DEFAULT_CLOUD_API).trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(candidate)) return DEFAULT_CLOUD_API;
  return candidate;
}

function bootstrapSecret(explicit) {
  return explicit || process.env.RESTAURANT_EDGE_BOOTSTRAP_SECRET || 'edge-dev-bootstrap';
}

module.exports = {
  requestJson,
  localBase,
  cloudBase,
  bootstrapSecret,
};

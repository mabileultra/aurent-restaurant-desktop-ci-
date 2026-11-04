const http = require('http');
const https = require('https');
const { DEFAULT_CLOUD_API, getCloudApiUrl } = require('../runtime/cloudApiUrlStore');

function resolveVerifyUrls() {
  const base = String(getCloudApiUrl() || DEFAULT_CLOUD_API).replace(/\/+$/, '');
  if (!base) return [];
  return [`${base}/public/cashier/server-setup/verify-password`];
}

function httpPostJson(url, body, { timeoutMs = 12000 } = {}) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      resolve({ ok: false, network: true });
      return;
    }
    const payload = JSON.stringify(body);
    const isHttps = parsed.protocol === 'https:';
    const client = isHttps ? https : http;
    const req = client.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method: 'POST',
        rejectUnauthorized: false,
        timeout: timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            const data = raw ? JSON.parse(raw) : {};
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              data,
              network: false,
            });
          } catch {
            resolve({ ok: false, data: null, network: true });
          }
        });
      },
    );
    req.on('error', () => resolve({ ok: false, data: null, network: true }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, data: null, network: true });
    });
    req.write(payload);
    req.end();
  });
}

/** Same platform password as retail Cashier (super-admin «Безопасность»). */
async function verifyServerSetupPassword(password) {
  if (!password) return { ok: false, reason: 'empty' };
  const urls = resolveVerifyUrls();
  if (!urls.length) return { ok: false, reason: 'network' };

  let sawInvalid = false;
  let sawReachable = false;
  for (const url of urls) {
    const result = await httpPostJson(url, { password });
    if (!result.ok) continue;
    sawReachable = true;
    if (result.data?.valid) return { ok: true };
    sawInvalid = true;
  }
  if (sawInvalid || sawReachable) return { ok: false, reason: 'invalid' };
  return { ok: false, reason: 'network' };
}

module.exports = {
  verifyServerSetupPassword,
  resolveVerifyUrls,
};

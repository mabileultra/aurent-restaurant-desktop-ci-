const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULT_CLOUD_API = 'https://r-aurent.uz/api/v1';

function storePath() {
  return path.join(app.getPath('userData'), 'cloud-api-url.txt');
}

function normalizeCloudApiUrl(raw) {
  const value = String(raw || '').trim().replace(/\/$/, '');
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) return '';
  return value;
}

function getCloudApiUrl() {
  try {
    if (!fs.existsSync(storePath())) return DEFAULT_CLOUD_API;
    return normalizeCloudApiUrl(fs.readFileSync(storePath(), 'utf8')) || DEFAULT_CLOUD_API;
  } catch {
    return DEFAULT_CLOUD_API;
  }
}

function setCloudApiUrl(url) {
  const normalized = normalizeCloudApiUrl(url) || DEFAULT_CLOUD_API;
  try {
    fs.writeFileSync(storePath(), `${normalized}\n`, 'utf8');
  } catch {
    /* ignore */
  }
  process.env.RESTAURANT_CLOUD_API_URL = normalized;
  process.env.RESTAURANT_CLOUD_SYNC_URL = normalized;
  return normalized;
}

/** Apply saved cloud URL into process env before edge bootstrap/sync. */
function applyCloudApiUrlFromDisk() {
  const url = getCloudApiUrl();
  process.env.RESTAURANT_CLOUD_API_URL = url;
  process.env.RESTAURANT_CLOUD_SYNC_URL = url;
  return url;
}

module.exports = {
  DEFAULT_CLOUD_API,
  getCloudApiUrl,
  setCloudApiUrl,
  applyCloudApiUrlFromDisk,
};

const path = require('path');

const MIME_BY_EXT = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
};

function mimeForFile(filePath) {
  const ext = path.extname(String(filePath || '')).toLowerCase();
  return MIME_BY_EXT[ext] || 'application/octet-stream';
}

module.exports = { mimeForFile, MIME_BY_EXT };

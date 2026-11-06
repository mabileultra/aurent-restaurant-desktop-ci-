const fs = require('fs');
const path = require('path');
const { mimeForFile } = require('./staticMime');

function safeJoin(root, requestPath) {
  const rootAbs = path.resolve(root);
  const relative = String(requestPath || '/').replace(/\\/g, '/');
  const target = path.resolve(rootAbs, `.${relative.startsWith('/') ? relative : `/${relative}`}`);
  const rel = path.relative(rootAbs, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return target;
}

function sendFile(res, filePath, headOnly) {
  const body = fs.readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': mimeForFile(filePath),
    'Content-Length': body.length,
    'Cache-Control': 'no-cache',
  });
  if (!headOnly) res.end(body);
  else res.end();
}

function serveStatic(req, res, uiRoot) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;

  let pathname = '/';
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname || '/');
  } catch {
    res.writeHead(400);
    res.end();
    return true;
  }

  const requestPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = safeJoin(uiRoot, requestPath);
  if (!filePath) {
    res.writeHead(403);
    res.end();
    return true;
  }

  const headOnly = req.method === 'HEAD';
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(res, filePath, headOnly);
    return true;
  }

  const indexPath = path.join(path.resolve(uiRoot), 'index.html');
  if (fs.existsSync(indexPath)) {
    sendFile(res, indexPath, headOnly);
    return true;
  }

  res.writeHead(404);
  res.end();
  return true;
}

module.exports = { safeJoin, serveStatic };

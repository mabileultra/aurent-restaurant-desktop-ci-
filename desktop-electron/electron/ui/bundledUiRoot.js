const fs = require('fs');
const path = require('path');

function bundledIndexPath(dir) {
  return path.join(dir, 'index.html');
}

function isBundledUiRoot(dir) {
  try {
    return Boolean(dir) && fs.existsSync(bundledIndexPath(dir));
  } catch {
    return false;
  }
}

/**
 * Pharmacy/main → `ui`. Restaurant world → `ui-restaurant` (falls back to `ui` only if missing).
 */
function resolveBundledUiRoot({
  isPackaged = false,
  resourcesPath = '',
  appPath = '',
  appWorld = '',
} = {}) {
  const restaurant = String(appWorld || '').toLowerCase() === 'restaurant'
    || String(appWorld || '').toLowerCase() === 'rst';
  const folderNames = restaurant ? ['ui-restaurant', 'ui'] : ['ui'];

  const candidates = [];
  for (const name of folderNames) {
    if (isPackaged && resourcesPath) {
      candidates.push(path.join(resourcesPath, name));
    }
    if (appPath) {
      candidates.push(path.join(appPath, name));
    }
    candidates.push(path.join(__dirname, '..', '..', name));
  }

  for (const dir of candidates) {
    if (isBundledUiRoot(dir)) return dir;
  }
  return null;
}

module.exports = {
  bundledIndexPath,
  isBundledUiRoot,
  resolveBundledUiRoot,
};

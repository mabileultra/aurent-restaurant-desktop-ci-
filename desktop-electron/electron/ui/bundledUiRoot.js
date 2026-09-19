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

function resolveBundledUiRoot({
  isPackaged = false,
  resourcesPath = '',
  appPath = '',
} = {}) {
  const candidates = [];
  if (isPackaged && resourcesPath) {
    candidates.push(path.join(resourcesPath, 'ui'));
  }
  if (appPath) {
    candidates.push(path.join(appPath, 'ui'));
  }
  candidates.push(path.join(__dirname, '..', '..', 'ui'));

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

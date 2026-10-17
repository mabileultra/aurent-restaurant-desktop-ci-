const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const SERVICE_PORT = Number(process.env.RESTAURANT_SERVER_PORT || 8087);
const SERVICE_HOST = process.env.RESTAURANT_EDGE_HOST || '127.0.0.1';
const SERVICE_BASE = `http://${SERVICE_HOST}:${SERVICE_PORT}/api/v1`;
const HEALTH_URL = `${SERVICE_BASE}/actuator/health`;

const DB_PORT = Number(process.env.RESTAURANT_DB_PORT || 5439);
const DB_USER = process.env.RESTAURANT_DB_USERNAME || 'restaurant_user';
const DB_PASSWORD = process.env.RESTAURANT_DB_PASSWORD || 'restaurant_password';
const DB_NAME = process.env.RESTAURANT_DB_NAME || 'restaurant_db';
const DB_URL = process.env.RESTAURANT_DB_URL
  || `jdbc:postgresql://127.0.0.1:${DB_PORT}/${DB_NAME}`;

function userDataDir() {
  try {
    return app.getPath('userData');
  } catch {
    return path.join(process.cwd(), '.restaurant-desktop-data');
  }
}

function resolveUiRoot(isPackaged) {
  if (isPackaged) {
    return path.join(process.resourcesPath, 'ui');
  }
  return path.join(__dirname, '..', 'ui');
}

function resolveJarCandidates(isPackaged) {
  const fromEnv = process.env.RESTAURANT_SERVICE_JAR;
  if (fromEnv) return [fromEnv];
  const list = [];
  if (isPackaged) {
    list.push(path.join(process.resourcesPath, 'resources', 'restaurant-service.jar'));
  }
  const targetDir = path.join(__dirname, '..', '..', 'restaurant-service', 'target');
  try {
    for (const name of fs.readdirSync(targetDir)) {
      if (/^restaurant-service-.*\.jar$/.test(name) && !name.endsWith('-plain.jar')) {
        list.push(path.join(targetDir, name));
      }
    }
  } catch {
    /* target not built yet */
  }
  list.push(path.join(__dirname, '..', 'resources', 'restaurant-service.jar'));
  return list;
}

/** Bundled JRE (clean PC) → PATH java. */
function resolveJavaBinary(isPackaged) {
  const fromEnv = process.env.RESTAURANT_JAVA_HOME || process.env.JAVA_HOME;
  const candidates = [];
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  const plat = process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'mac' : 'linux';
  const javaName = process.platform === 'win32' ? 'java.exe' : 'java';

  const jreRoots = [];
  if (isPackaged) {
    jreRoots.push(path.join(process.resourcesPath, 'resources', `jre-${plat}-${arch}`));
    jreRoots.push(path.join(process.resourcesPath, 'resources', 'jre'));
  }
  jreRoots.push(path.join(__dirname, '..', 'resources', `jre-${plat}-${arch}`));
  jreRoots.push(path.join(__dirname, '..', 'resources', 'jre'));

  for (const root of jreRoots) {
    candidates.push(path.join(root, 'bin', javaName));
  }
  if (fromEnv) {
    candidates.push(path.join(fromEnv, 'bin', javaName));
  }
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return 'java';
}

module.exports = {
  SERVICE_PORT,
  SERVICE_HOST,
  SERVICE_BASE,
  HEALTH_URL,
  userDataDir,
  resolveUiRoot,
  resolveJarCandidates,
  resolveJavaBinary,
  DB_URL,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT,
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-use-at-least-32-chars-for-hs256!!',
};

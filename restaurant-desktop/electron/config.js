const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const SERVICE_PORT = Number(process.env.RESTAURANT_SERVER_PORT || 8087);
const SERVICE_HOST = process.env.RESTAURANT_EDGE_HOST || '127.0.0.1';
const SERVICE_BASE = `http://${SERVICE_HOST}:${SERVICE_PORT}/api/v1`;
const HEALTH_URL = `${SERVICE_BASE}/actuator/health`;

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

module.exports = {
  SERVICE_PORT,
  SERVICE_HOST,
  SERVICE_BASE,
  HEALTH_URL,
  userDataDir,
  resolveUiRoot,
  resolveJarCandidates,
  DB_URL: process.env.RESTAURANT_DB_URL || 'jdbc:postgresql://127.0.0.1:5439/restaurant_db',
  DB_USER: process.env.RESTAURANT_DB_USERNAME || 'restaurant_user',
  DB_PASSWORD: process.env.RESTAURANT_DB_PASSWORD || 'restaurant_password',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-use-at-least-32-chars-for-hs256!!',
};

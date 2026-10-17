const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const {
  HEALTH_URL,
  DB_URL,
  DB_USER,
  DB_PASSWORD,
  JWT_SECRET,
  SERVICE_PORT,
  resolveJarCandidates,
} = require('../config');
const { probeHealth, waitForHealth } = require('./health');

let javaChild = null;
let startedByUs = false;

function findJar(isPackaged) {
  for (const candidate of resolveJarCandidates(isPackaged)) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function stopEdgeService() {
  if (!javaChild || !startedByUs) {
    javaChild = null;
    startedByUs = false;
    return;
  }
  try {
    javaChild.kill('SIGTERM');
  } catch {
    /* ignore */
  }
  javaChild = null;
  startedByUs = false;
}

/**
 * Ensure edge restaurant-service is up.
 * - If health already OK → reuse (dev may have run scripts/run-restaurant-edge.sh).
 * - Else spawn java -jar with SPRING_PROFILES_ACTIVE=edge.
 * Postgres must already be reachable (docker-compose.restaurant-edge.yml).
 */
async function ensureEdgeService({ isPackaged = false, log = console.log } = {}) {
  const existing = await probeHealth(HEALTH_URL);
  if (existing.ok) {
    log('[edge] restaurant-service already healthy');
    return { health: existing, jar: null, reused: true };
  }

  const jar = findJar(isPackaged);
  if (!jar) {
    throw new Error(
      'restaurant-service.jar not found. Build jar or set RESTAURANT_SERVICE_JAR. '
      + 'Also start Postgres: docker compose -f docker-compose.restaurant-edge.yml up -d'
    );
  }

  log(`[edge] starting jar: ${jar}`);
  const cloudApi = process.env.RESTAURANT_CLOUD_API_URL
    || process.env.RESTAURANT_CLOUD_SYNC_URL
    || '';
  const env = {
    ...process.env,
    SPRING_PROFILES_ACTIVE: 'edge',
    RESTAURANT_SERVER_PORT: String(SERVICE_PORT),
    RESTAURANT_DB_URL: DB_URL,
    RESTAURANT_DB_USERNAME: DB_USER,
    RESTAURANT_DB_PASSWORD: DB_PASSWORD,
    JWT_SECRET,
    PIN_SECRET: process.env.PIN_SECRET || JWT_SECRET,
    RESTAURANT_CLOUD_SYNC_URL: cloudApi,
    RESTAURANT_CLOUD_API_URL: cloudApi || process.env.RESTAURANT_CLOUD_API_URL || '',
  };

  javaChild = spawn('java', ['-jar', jar], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  startedByUs = true;

  javaChild.stdout.on('data', (buf) => {
    const line = String(buf).trim();
    if (line) log(`[service] ${line.slice(0, 300)}`);
  });
  javaChild.stderr.on('data', (buf) => {
    const line = String(buf).trim();
    if (line) log(`[service:err] ${line.slice(0, 300)}`);
  });
  javaChild.on('exit', (code, signal) => {
    log(`[edge] java exited code=${code} signal=${signal}`);
    javaChild = null;
    startedByUs = false;
  });

  const health = await waitForHealth(HEALTH_URL, { timeoutMs: 120_000 });
  log('[edge] restaurant-service is healthy');
  return { health, jar, reused: false };
}

function getStackStatus() {
  return {
    serviceManaged: startedByUs,
    servicePid: javaChild?.pid || null,
    healthUrl: HEALTH_URL,
  };
}

module.exports = {
  ensureEdgeService,
  stopEdgeService,
  getStackStatus,
  findJar,
};

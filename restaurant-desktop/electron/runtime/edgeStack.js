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
  resolveJavaBinary,
} = require('../config');
const { probeHealth, waitForHealth } = require('./health');
const { ensureEdgePostgres, stopEdgePostgres } = require('./edgePostgres');

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
 * Starts local Postgres (embedded) then java -jar — no Docker required.
 */
async function ensureEdgeService({ isPackaged = false, log = console.log } = {}) {
  const existing = await probeHealth(HEALTH_URL);
  if (existing.ok) {
    log('[edge] restaurant-service already healthy');
    return { health: existing, jar: null, reused: true };
  }

  await ensureEdgePostgres({ log });

  const jar = findJar(isPackaged);
  if (!jar) {
    throw new Error(
      'restaurant-service.jar not found. Rebuild installer (prepare copies jar into resources/).'
    );
  }

  const javaBin = resolveJavaBinary(isPackaged);
  log(`[edge] starting jar: ${jar}`);
  log(`[edge] java: ${javaBin}`);
  const cloudApi = process.env.RESTAURANT_CLOUD_API_URL
    || process.env.RESTAURANT_CLOUD_SYNC_URL
    || 'https://r-aurent.uz/api/v1';
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
    RESTAURANT_CLOUD_API_URL: cloudApi,
  };
  // So Electron bootstrap (same process) also sees an absolute cloud base.
  process.env.RESTAURANT_CLOUD_API_URL = cloudApi;
  process.env.RESTAURANT_CLOUD_SYNC_URL = cloudApi;

  javaChild = spawn(javaBin, ['-jar', jar], {
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
  javaChild.on('error', (err) => {
    log(`[edge] java spawn failed: ${err.message}`, true);
  });

  // First Liquibase on slow hall PCs can take 1–3 min — keep UI alive with progress.
  const health = await waitForHealth(HEALTH_URL, {
    timeoutMs: 180_000,
    intervalMs: 1_200,
    onProgress: ({ elapsedMs }) => {
      const sec = Math.round(elapsedMs / 1000);
      log(`[edge] waiting for service… ${sec}s (миграции БД при первом запуске)`);
    },
  });
  if (!javaChild) {
    throw new Error('restaurant-service exited before becoming healthy — see log above');
  }
  log('[edge] restaurant-service is healthy');
  return { health, jar, reused: false };
}

async function shutdownEdgeStack({ log = console.log } = {}) {
  stopEdgeService();
  await stopEdgePostgres({ log });
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
  shutdownEdgeStack,
  getStackStatus,
  findJar,
};

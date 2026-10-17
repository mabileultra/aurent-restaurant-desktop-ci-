/**
 * Local Postgres for edge hall PC — no Docker.
 * Uses `embedded-postgres` binaries shipped in node_modules (ESM → dynamic import).
 */
const fs = require('fs');
const path = require('path');
const net = require('net');
const { userDataDir, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = require('../config');

let cluster = null;
let startedByUs = false;

function dataDir() {
  return path.join(userDataDir(), 'pgdata');
}

function markerPath() {
  return path.join(dataDir(), 'PG_VERSION');
}

function portOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(800, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function loadEmbeddedPostgres() {
  const mod = await import('embedded-postgres');
  return mod.default || mod;
}

async function ensureEdgePostgres({ log = console.log } = {}) {
  if (await portOpen(DB_PORT)) {
    log(`[edge-db] Postgres already listening on ${DB_PORT}`);
    return { reused: true, port: DB_PORT };
  }

  const EmbeddedPostgres = await loadEmbeddedPostgres();
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });

  cluster = new EmbeddedPostgres({
    databaseDir: dir,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    persistent: true,
    initdbFlags: ['--locale=C', '--encoding=UTF8'],
  });

  if (!fs.existsSync(markerPath())) {
    log(`[edge-db] initdb → ${dir}`);
    await cluster.initialise();
  }

  log(`[edge-db] starting Postgres on ${DB_PORT}…`);
  await cluster.start();
  startedByUs = true;

  try {
    await cluster.createDatabase(DB_NAME);
    log(`[edge-db] database ${DB_NAME} ready`);
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    if (/already exists/i.test(msg)) {
      log(`[edge-db] database ${DB_NAME} already exists`);
    } else {
      throw err;
    }
  }

  return { reused: false, port: DB_PORT };
}

async function stopEdgePostgres({ log = console.log } = {}) {
  if (!cluster || !startedByUs) {
    cluster = null;
    startedByUs = false;
    return;
  }
  try {
    log('[edge-db] stopping Postgres…');
    await cluster.stop();
  } catch (err) {
    log(`[edge-db] stop warning: ${err.message || err}`);
  }
  cluster = null;
  startedByUs = false;
}

module.exports = {
  ensureEdgePostgres,
  stopEdgePostgres,
  dataDir,
};

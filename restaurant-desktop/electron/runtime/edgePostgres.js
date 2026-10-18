/**
 * Local Postgres for edge hall PC — no Docker.
 * Binaries from resources/pgsql (Electron extraResources), not asar node_modules.
 */
const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn, execFile } = require('child_process');
const { app } = require('electron');
const { userDataDir, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = require('../config');

let pgChild = null;
let startedByUs = false;

function dataDir() {
  return path.join(userDataDir(), 'pgdata');
}

function markerPath() {
  return path.join(dataDir(), 'PG_VERSION');
}

function exe(name) {
  return process.platform === 'win32' ? `${name}.exe` : name;
}

/** Packaged: resources/pgsql; dev: resources/pgsql or node_modules platform package. */
function resolvePgsqlBinDir() {
  const candidates = [];
  try {
    if (app.isPackaged) {
      candidates.push(path.join(process.resourcesPath, 'resources', 'pgsql', 'bin'));
      candidates.push(path.join(process.resourcesPath, 'pgsql', 'bin'));
    }
  } catch {
    /* app not ready */
  }
  candidates.push(path.join(__dirname, '..', '..', 'resources', 'pgsql', 'bin'));

  const platPkg =
    process.platform === 'win32'
      ? '@embedded-postgres/windows-x64'
      : process.arch === 'arm64'
        ? '@embedded-postgres/darwin-arm64'
        : '@embedded-postgres/darwin-x64';
  candidates.push(
    path.join(__dirname, '..', '..', 'node_modules', ...platPkg.split('/'), 'native', 'bin')
  );

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, exe('initdb')))) return dir;
  }
  return null;
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

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function run(bin, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      ...opts,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let err = '';
    child.stderr.on('data', (c) => { err += c.toString(); });
    child.stdout.on('data', () => {});
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(bin)} failed (code ${code}): ${err.slice(0, 500)}`));
    });
  });
}

function initdbFlags() {
  if (process.platform === 'win32') return ['--encoding=UTF8'];
  return ['--locale=C', '--encoding=UTF8'];
}

async function initialiseCluster(binDir, dir, log) {
  const initdb = path.join(binDir, exe('initdb'));
  const pwFile = path.join(userDataDir(), `pg-password-${process.pid}.txt`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(pwFile, `${DB_PASSWORD}\n`, 'utf8');
  log(`[edge-db] initdb → ${dir}`);
  log('[edge-db] first run can take 1–2 min; allow antivirus if prompted');
  try {
    await withTimeout(
      run(initdb, [
        `--pgdata=${dir}`,
        '--auth=password',
        `--username=${DB_USER}`,
        `--pwfile=${pwFile}`,
        ...initdbFlags(),
      ]),
      180_000,
      'Postgres initdb'
    );
  } catch (err) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    throw new Error(
      `${err.message || err}. Delete pgdata folder and allow Aurent in antivirus.`
    );
  } finally {
    try {
      fs.unlinkSync(pwFile);
    } catch {
      /* ignore */
    }
  }
  log('[edge-db] initdb done');
}

async function startCluster(binDir, dir, log) {
  const postgres = path.join(binDir, exe('postgres'));
  log(`[edge-db] starting Postgres on ${DB_PORT}…`);
  await new Promise((resolve, reject) => {
    pgChild = spawn(
      postgres,
      ['-D', dir, '-p', String(DB_PORT)],
      { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }
    );
    startedByUs = true;
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Postgres start timed out after 60s'));
      }
    }, 60_000);
    const onData = (buf) => {
      const msg = String(buf);
      if (msg.includes('ready to accept connections') && !settled) {
        settled = true;
        clearTimeout(timer);
        resolve();
      }
    };
    pgChild.stderr.on('data', onData);
    pgChild.stdout.on('data', onData);
    pgChild.on('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    });
    pgChild.on('exit', (code) => {
      pgChild = null;
      startedByUs = false;
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Postgres exited early code=${code}`));
      }
    });
  });
}

async function createDbIfNeeded(log) {
  const { Client } = require('pg');
  const client = new Client({
    host: '127.0.0.1',
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres',
  });
  await client.connect();
  try {
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      log(`[edge-db] database ${DB_NAME} ready`);
    } else {
      log(`[edge-db] database ${DB_NAME} already exists`);
    }
  } finally {
    await client.end().catch(() => {});
  }
}

async function ensureEdgePostgres({ log = console.log } = {}) {
  if (await portOpen(DB_PORT)) {
    log(`[edge-db] Postgres already listening on ${DB_PORT}`);
    return { reused: true, port: DB_PORT };
  }

  const binDir = resolvePgsqlBinDir();
  if (!binDir) {
    throw new Error(
      'Postgres binaries (initdb) not found. Reinstall Aurent Restaurant (resources/pgsql missing).'
    );
  }
  log(`[edge-db] binaries: ${binDir}`);

  const dir = dataDir();
  if (!fs.existsSync(markerPath())) {
    await initialiseCluster(binDir, dir, log);
  }

  await startCluster(binDir, dir, log);
  await createDbIfNeeded(log);
  return { reused: false, port: DB_PORT };
}

async function stopEdgePostgres({ log = console.log } = {}) {
  if (!pgChild || !startedByUs) {
    pgChild = null;
    startedByUs = false;
    return;
  }
  try {
    log('[edge-db] stopping Postgres…');
    if (process.platform === 'win32') {
      pgChild.kill();
    } else {
      pgChild.kill('SIGTERM');
    }
  } catch (err) {
    log(`[edge-db] stop warning: ${err.message || err}`);
  }
  pgChild = null;
  startedByUs = false;
}

module.exports = {
  ensureEdgePostgres,
  stopEdgePostgres,
  dataDir,
  resolvePgsqlBinDir,
};

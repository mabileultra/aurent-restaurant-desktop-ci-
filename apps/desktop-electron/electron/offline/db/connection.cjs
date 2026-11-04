const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const crypto = require('crypto');
const { SCHEMA } = require('./schema.cjs');
const { resolveOfflineEngine, ENGINE_NATIVE } = require('../engine/offlineEngine');
const {
  resolveSqlWasmFile,
  openSqlJsDatabase,
  persistSqlJsDatabase,
} = require('../engine/sqlJsDatabase.cjs');
const {
  openNativeDatabase,
  persistNativeDb,
  closeNativeDb,
} = require('../engine/nativeDatabase.cjs');

let db;
let dbPath;
let engine = 'sqljs';

const DB_INIT_TIMEOUT_MS = 15_000;

function dbFilePath() {
  if (!dbPath) {
    dbPath = path.join(app.getPath('userData'), 'pos-offline.db');
  }
  return dbPath;
}

function readUserOfflineConfig() {
  try {
    const file = path.join(app.getPath('userData'), 'config.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch {
    // ignore
  }
  return {};
}

function withDbTimeout(promise, label = 'offline-db') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timeout`)), DB_INIT_TIMEOUT_MS);
    }),
  ]);
}

function persistDb() {
  if (!db) return;
  try {
    if (engine === ENGINE_NATIVE) {
      persistNativeDb(db);
      return;
    }
    persistSqlJsDatabase(db, dbFilePath());
  } catch (err) {
    console.error('[offline-db] persist failed:', err?.message || err);
  }
}

function rowsFromStmt(stmt) {
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function parseJson(raw, fallback = null) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getMeta(key) {
  if (!db) return null;
  const stmt = db.prepare('SELECT value FROM meta WHERE key = ?');
  stmt.bind([key]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row?.value ?? null;
}

function setMeta(key, value, { persist = true } = {}) {
  db.run(
    'INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, String(value ?? '')],
  );
  if (persist) persistDb();
}

function ensureDeviceId() {
  let id = getMeta('deviceId');
  if (!id) {
    id = crypto.randomUUID();
    setMeta('deviceId', id);
  }
  return id;
}

function tryOpenNative(file) {
  try {
    return openNativeDatabase(file);
  } catch (err) {
    console.warn('[offline-db] native sqlite unavailable, using sql.js:', err?.message || err);
    return null;
  }
}

async function openSqlJs(file) {
  const locateFile = (wasmFile) =>
    resolveSqlWasmFile(wasmFile, {
      resourcesPath: process.resourcesPath,
      appPath: (() => {
        try {
          return app.getAppPath();
        } catch {
          return '';
        }
      })(),
    });
  return withDbTimeout(openSqlJsDatabase(file, locateFile), 'sql.js load');
}

async function getDb() {
  if (db) return db;
  const file = dbFilePath();
  const requested = resolveOfflineEngine({ userConfig: readUserOfflineConfig() });

  if (requested === ENGINE_NATIVE) {
    db = tryOpenNative(file);
    engine = db ? ENGINE_NATIVE : 'sqljs';
  } else {
    engine = 'sqljs';
  }

  if (!db) {
    db = await openSqlJs(file);
    engine = 'sqljs';
  }

  db.run(SCHEMA);
  ensureDeviceId();
  persistDb();
  return db;
}

function getOfflineEngineName() {
  return engine;
}

async function resetConnectionForTests({ userDataDir } = {}) {
  if (engine === ENGINE_NATIVE) {
    closeNativeDb(db);
  }
  db = null;
  dbPath = userDataDir ? path.join(userDataDir, 'pos-offline.db') : null;
  engine = 'sqljs';
}

module.exports = {
  getDb,
  persistDb,
  rowsFromStmt,
  parseJson,
  getMeta,
  setMeta,
  ensureDeviceId,
  getOfflineEngineName,
  resetConnectionForTests,
};

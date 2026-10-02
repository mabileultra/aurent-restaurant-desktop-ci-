/**
 * Restaurant local-first SQLite (separate from pharmacy pos-offline.db).
 * better-sqlite3 when available; otherwise sql.js file-backed facade.
 */
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { applyRestaurantOfflineSchema } = require('./migrate.cjs');
const {
  resolveSqlWasmFile,
  openSqlJsDatabase,
  persistSqlJsDatabase,
} = require('../../offline/engine/sqlJsDatabase.cjs');
const { resolveOfflineEngine, ENGINE_NATIVE } = require('../../offline/engine/offlineEngine');

let db = null;
let dbPath = null;
let engine = 'sqljs';
let sqlJsRaw = null;

function restaurantDbFilePath() {
  if (!dbPath) {
    dbPath = path.join(app.getPath('userData'), 'restaurant-offline.db');
  }
  return dbPath;
}

function readUserOfflineConfig() {
  try {
    const file = path.join(app.getPath('userData'), 'config.json');
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    /* ignore */
  }
  return {};
}

function wrapSqlJsAsBetterApi(sqlDb, filePath) {
  const persist = () => {
    try {
      persistSqlJsDatabase(sqlDb, filePath);
    } catch (err) {
      console.error('[rst-offline-db] persist failed:', err?.message || err);
    }
  };
  return {
    __engine: 'sqljs',
    exec(sql) {
      sqlDb.exec(sql);
      persist();
    },
    prepare(sql) {
      return {
        run(...params) {
          sqlDb.run(sql, params);
          persist();
          return { changes: sqlDb.getRowsModified() };
        },
        get(...params) {
          const stmt = sqlDb.prepare(sql);
          try {
            stmt.bind(params);
            if (stmt.step()) return stmt.getAsObject();
            return undefined;
          } finally {
            stmt.free();
          }
        },
        all(...params) {
          const stmt = sqlDb.prepare(sql);
          const rows = [];
          try {
            stmt.bind(params);
            while (stmt.step()) rows.push(stmt.getAsObject());
            return rows;
          } finally {
            stmt.free();
          }
        },
      };
    },
    close() {
      try {
        persist();
        sqlDb.close();
      } catch {
        /* ignore */
      }
    },
  };
}

function tryOpenNative(file) {
  try {
    const Database = require('better-sqlite3');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const raw = new Database(file);
    raw.pragma('journal_mode = WAL');
    raw.pragma('synchronous = NORMAL');
    return raw;
  } catch (err) {
    console.warn('[rst-offline-db] native unavailable:', err?.message || err);
    return null;
  }
}

async function getRestaurantOfflineDb() {
  if (db) return db;
  const file = restaurantDbFilePath();
  const requested = resolveOfflineEngine({ userConfig: readUserOfflineConfig() });

  if (requested === ENGINE_NATIVE) {
    const native = tryOpenNative(file);
    if (native) {
      db = native;
      engine = ENGINE_NATIVE;
    }
  }

  if (!db) {
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
    sqlJsRaw = await openSqlJsDatabase(file, locateFile);
    db = wrapSqlJsAsBetterApi(sqlJsRaw, file);
    engine = 'sqljs';
  }

  applyRestaurantOfflineSchema(db);
  return db;
}

async function resetRestaurantOfflineDbForTests({ userDataDir } = {}) {
  if (db) {
    try {
      db.close();
    } catch {
      /* ignore */
    }
  }
  db = null;
  sqlJsRaw = null;
  dbPath = userDataDir ? path.join(userDataDir, 'restaurant-offline.db') : null;
  engine = 'sqljs';
}

function getRestaurantOfflineEngineName() {
  return engine;
}

module.exports = {
  getRestaurantOfflineDb,
  resetRestaurantOfflineDbForTests,
  getRestaurantOfflineEngineName,
  restaurantDbFilePath,
};

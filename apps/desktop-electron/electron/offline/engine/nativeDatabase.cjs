const fs = require('fs');
const path = require('path');

function wrapNativeDb(raw) {
  return {
    __engine: 'native',
    __raw: raw,
    run(sql, params) {
      const text = String(sql || '');
      if (!params || params.length === 0) {
        raw.exec(text);
        return;
      }
      raw.prepare(text).run(...params);
    },
    prepare(sql) {
      const stmt = raw.prepare(sql);
      let bound = [];
      let rows = null;
      let index = 0;
      let current = null;
      return {
        bind(params) {
          bound = Array.isArray(params) ? params : [];
          rows = null;
          index = 0;
          current = null;
        },
        step() {
          if (!rows) {
            rows = bound.length ? stmt.all(...bound) : stmt.all();
            index = 0;
          }
          if (index >= rows.length) {
            current = null;
            return false;
          }
          current = rows[index];
          index += 1;
          return true;
        },
        getAsObject() {
          return current || {};
        },
        free() {
          rows = null;
          current = null;
        },
      };
    },
  };
}

function openNativeDatabase(filePath) {
  const Database = require('better-sqlite3');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const raw = new Database(filePath);
  raw.pragma('journal_mode = WAL');
  raw.pragma('synchronous = NORMAL');
  return wrapNativeDb(raw);
}

function persistNativeDb(db) {
  try {
    db?.__raw?.pragma('wal_checkpoint(PASSIVE)');
  } catch {
    // ignore
  }
}

function closeNativeDb(db) {
  try {
    db?.__raw?.close();
  } catch {
    // ignore
  }
}

module.exports = {
  wrapNativeDb,
  openNativeDatabase,
  persistNativeDb,
  closeNativeDb,
};

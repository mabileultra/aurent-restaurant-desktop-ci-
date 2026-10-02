/**
 * Minimal better-sqlite3-like facade over sql.js for unit tests (no native addon).
 */
const path = require('path');
const { resolveSqlWasmFile, openSqlJsDatabase } = require('../../offline/engine/sqlJsDatabase.cjs');

async function openSqlJsMemoryDb() {
  const wasm = resolveSqlWasmFile('sql-wasm.wasm', {
    cwd: path.join(__dirname, '..', '..', '..'),
  });
  const db = await openSqlJsDatabase(':memory:', (file) => {
    if (String(file).endsWith('.wasm')) return wasm;
    return file;
  });

  return {
    exec(sql) {
      db.exec(sql);
    },
    prepare(sql) {
      return {
        run(...params) {
          db.run(sql, params);
          return { changes: db.getRowsModified() };
        },
        get(...params) {
          const stmt = db.prepare(sql);
          try {
            stmt.bind(params);
            if (stmt.step()) return stmt.getAsObject();
            return undefined;
          } finally {
            stmt.free();
          }
        },
        all(...params) {
          const stmt = db.prepare(sql);
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
      db.close();
    },
  };
}

module.exports = { openSqlJsMemoryDb };

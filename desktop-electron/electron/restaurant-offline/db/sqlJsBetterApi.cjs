/**
 * better-sqlite3-like facade over sql.js.
 * Critical: never export()/persist while a TX is open — sql.js export
 * clears the active transaction ("cannot commit - no transaction is active").
 */
const { persistSqlJsDatabase } = require('../../offline/engine/sqlJsDatabase.cjs');

function classifyTxStatement(sql) {
  const head = String(sql || '')
    .trim()
    .split(';')[0]
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
  if (head.startsWith('BEGIN')) return 'begin';
  if (head.startsWith('COMMIT') || head === 'END' || head.startsWith('END TRANSACTION')) {
    return 'commit';
  }
  if (head.startsWith('ROLLBACK')) return 'rollback';
  return 'other';
}

function wrapSqlJsAsBetterApi(sqlDb, filePath, { persistFn = persistSqlJsDatabase } = {}) {
  let txDepth = 0;

  const persist = () => {
    if (txDepth > 0) return;
    try {
      persistFn(sqlDb, filePath);
    } catch (err) {
      console.error('[rst-offline-db] persist failed:', err?.message || err);
    }
  };

  const afterExec = (sql) => {
    const kind = classifyTxStatement(sql);
    if (kind === 'begin') txDepth += 1;
    else if (kind === 'commit' || kind === 'rollback') txDepth = Math.max(0, txDepth - 1);
    persist();
  };

  return {
    __engine: 'sqljs',
    __txDepth: () => txDepth,
    exec(sql) {
      sqlDb.exec(sql);
      afterExec(sql);
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

module.exports = { wrapSqlJsAsBetterApi, classifyTxStatement };

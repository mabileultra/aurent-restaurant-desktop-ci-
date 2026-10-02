/**
 * B2 — run a function inside BEGIN…COMMIT; rollback on throw.
 * Works with better-sqlite3 and sqlJsMemoryDb facade (.exec).
 */

function runInTransaction(db, fn) {
  if (!db || typeof db.exec !== 'function') {
    throw new Error('restaurant_offline_db_required');
  }
  if (typeof fn !== 'function') {
    throw new Error('restaurant_offline_tx_fn_required');
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn(db);
    db.exec('COMMIT');
    return result;
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      /* already rolled back / no tx */
    }
    throw err;
  }
}

module.exports = { runInTransaction };

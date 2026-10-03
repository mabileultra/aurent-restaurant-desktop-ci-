/**
 * Regression: sql.js db.export() during BEGIN aborts the TX →
 * "cannot commit - no transaction is active" on open-order.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  resolveSqlWasmFile,
  openSqlJsDatabase,
  persistSqlJsDatabase,
} = require('../electron/offline/engine/sqlJsDatabase.cjs');
const { wrapSqlJsAsBetterApi } = require('../electron/restaurant-offline/db/sqlJsBetterApi.cjs');
const { runInTransaction } = require('../electron/restaurant-offline/db/tx.cjs');
const { openOrderCommand } = require('../electron/restaurant-offline/commands/openOrderCommand.cjs');
const { applyRestaurantOfflineSchema } = require('../electron/restaurant-offline/db/migrate.cjs');

async function openFacade(file) {
  const wasm = resolveSqlWasmFile('sql-wasm.wasm', { cwd: path.join(__dirname, '..') });
  const locate = (f) => path.join(path.dirname(wasm), path.basename(f));
  const raw = await openSqlJsDatabase(file, locate);
  return wrapSqlJsAsBetterApi(raw, file, { persistFn: persistSqlJsDatabase });
}

test('sql.js facade: COMMIT works when persist skipped during TX', async () => {
  const file = path.join(os.tmpdir(), `rst-tx-ok-${Date.now()}.db`);
  try {
    fs.unlinkSync(file);
  } catch {
    /* ignore */
  }
  const db = await openFacade(file);
  db.exec('CREATE TABLE t(id TEXT PRIMARY KEY)');
  runInTransaction(db, () => {
    db.prepare('INSERT INTO t(id) VALUES (?)').run('a');
  });
  assert.equal(db.prepare('SELECT id FROM t WHERE id = ?').get('a')?.id, 'a');
  assert.ok(fs.existsSync(file), 'persisted after commit');
  db.close();
});

test('sql.js facade: openOrderCommand completes (regression for toast spam)', async () => {
  const file = path.join(os.tmpdir(), `rst-open-${Date.now()}.db`);
  try {
    fs.unlinkSync(file);
  } catch {
    /* ignore */
  }
  const db = await openFacade(file);
  applyRestaurantOfflineSchema(db);
  const result = openOrderCommand(db, {
    deviceId: 'dev-1',
    storeId: 1,
    tableId: '10',
    guestCount: 2,
  });
  assert.ok(result.orderId);
  assert.ok(result.outboxId);
  db.close();
});

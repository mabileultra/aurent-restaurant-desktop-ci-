const test = require('node:test');
const assert = require('node:assert/strict');

const { applyRestaurantOfflineSchema } = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');
const { createPrintJobRepo } = require('../electron/restaurant-offline/db/printJobRepo.cjs');
const {
  resolvePrintJobCommand,
  listUnresolvedPrintJobs,
  ACTIONS,
} = require('../electron/restaurant-offline/print/resolvePrintJob.cjs');
const { PRINT_JOB_STATUS } = require('../electron/restaurant-offline/domain/index.cjs');

async function readyDb() {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  return db;
}

test('manual resolve UNKNOWN → PRINTED / FAILED / PENDING', async () => {
  const db = await readyDb();
  const prints = createPrintJobRepo(db, {
    idFactory: (() => {
      let n = 0;
      return () => `pj-${++n}`;
    })(),
    clock: () => '2026-10-03T08:00:00.000Z',
  });
  const a = prints.insertPending({
    orderId: 'ord-1',
    kind: 'KITCHEN_SEND',
    printerName: 'Kitchen',
    items: [{ name: 'a', qty: 1 }],
  });
  const b = prints.insertPending({
    orderId: 'ord-2',
    kind: 'KITCHEN_SEND',
    printerName: 'Kitchen',
    items: [{ name: 'b', qty: 1 }],
  });
  const c = prints.insertPending({
    orderId: 'ord-3',
    kind: 'KITCHEN_SEND',
    printerName: 'Kitchen',
    items: [{ name: 'c', qty: 1 }],
  });
  // force UNKNOWN via direct SQL (PRINTING→UNKNOWN allowed; skip PRINTING)
  db.prepare(`UPDATE print_jobs SET status = ? WHERE id = ?`).run(PRINT_JOB_STATUS.UNKNOWN, a.id);
  db.prepare(`UPDATE print_jobs SET status = ? WHERE id = ?`).run(PRINT_JOB_STATUS.UNKNOWN, b.id);
  db.prepare(`UPDATE print_jobs SET status = ? WHERE id = ?`).run(PRINT_JOB_STATUS.UNKNOWN, c.id);

  assert.equal(listUnresolvedPrintJobs(db).length, 3);

  assert.equal(
    resolvePrintJobCommand(db, { jobId: a.id, action: ACTIONS.ACK_PRINTED }).status,
    PRINT_JOB_STATUS.PRINTED,
  );
  assert.equal(
    resolvePrintJobCommand(db, { jobId: b.id, action: ACTIONS.MARK_FAILED }).status,
    PRINT_JOB_STATUS.FAILED,
  );
  assert.equal(
    resolvePrintJobCommand(db, { jobId: c.id, action: ACTIONS.REQUEUE }).status,
    PRINT_JOB_STATUS.PENDING,
  );
  assert.equal(listUnresolvedPrintJobs(db).length, 1); // FAILED remains listed
  db.close();
});

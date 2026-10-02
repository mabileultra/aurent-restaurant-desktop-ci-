/**
 * Hardening tests: update/cancel/pay + UNKNOWN resolve must not double-apply or crash.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const { applyRestaurantOfflineSchema } = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');
const {
  openOrderCommand,
  addOrderItemCommand,
  updateOrderItemCommand,
  cancelOrderItemCommand,
  cancelOrderCommand,
  payOrderCommand,
  toUiOrder,
} = require('../electron/restaurant-offline/commands/index.cjs');
const {
  resolvePrintJobCommand,
  listUnresolvedPrintJobs,
  ACTIONS,
} = require('../electron/restaurant-offline/print/resolvePrintJob.cjs');
const { createPrintJobRepo } = require('../electron/restaurant-offline/db/printJobRepo.cjs');
const {
  ORDER_STATUS,
  PRINT_JOB_STATUS,
  OUTBOX_STATUS,
} = require('../electron/restaurant-offline/domain/index.cjs');

async function readyDb() {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  const now = '2026-10-03T09:00:00.000Z';
  db.prepare(`INSERT INTO devices(device_id, label, created_at) VALUES (?, ?, ?)`).run('POS-T', 't', now);
  db.prepare(`INSERT INTO floor_tables(id, store_id, name, updated_at) VALUES (?, ?, ?, ?)`).run(
    'tbl-t',
    1,
    'T1',
    now,
  );
  return db;
}

function deps(prefix) {
  let n = 0;
  return {
    idFactory: () => `${prefix}-${++n}`,
    clock: () => '2026-10-03T09:00:00.000Z',
    uuid: () => `evt-${prefix}-${n}`,
  };
}

test('update item rejects invalid qty and leaves outbox clean', async () => {
  const db = await readyDb();
  const d = deps('u');
  const opened = openOrderCommand(db, {
    deviceId: 'POS-T', storeId: 1, tableId: 'tbl-t', guestCount: 1,
  }, d);
  const added = addOrderItemCommand(db, {
    deviceId: 'POS-T', orderId: opened.orderId, name: 'Чай', quantity: 1, unitPrice: 1000,
  }, d);
  const before = db.prepare(`SELECT COUNT(*) AS c FROM outbox`).get().c;
  assert.throws(
    () => updateOrderItemCommand(db, {
      deviceId: 'POS-T', orderId: opened.orderId, itemId: added.itemId, quantity: 0,
    }, d),
    /item_qty_invalid/,
  );
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM outbox`).get().c, before);
  assert.equal(toUiOrder(db, opened.orderId).items[0].quantity, 1);
  db.close();
});

test('cancel item twice is safe (already cancelled)', async () => {
  const db = await readyDb();
  const d = deps('c');
  const opened = openOrderCommand(db, {
    deviceId: 'POS-T', storeId: 1, tableId: 'tbl-t', guestCount: 1,
  }, d);
  const added = addOrderItemCommand(db, {
    deviceId: 'POS-T', orderId: opened.orderId, name: 'Суп', quantity: 1, unitPrice: 5000,
  }, d);
  db.prepare(`UPDATE order_items SET status = 'SENT' WHERE id = ?`).run(added.itemId);
  const first = cancelOrderItemCommand(db, {
    deviceId: 'POS-T', orderId: opened.orderId, itemId: added.itemId,
  }, d);
  assert.equal(first.deleted, false);
  const second = cancelOrderItemCommand(db, {
    deviceId: 'POS-T', orderId: opened.orderId, itemId: added.itemId,
  }, d);
  assert.equal(second.already, true);
  db.close();
});

test('pay is idempotent; cancel after pay is already', async () => {
  const db = await readyDb();
  const d = deps('p');
  const opened = openOrderCommand(db, {
    deviceId: 'POS-T', storeId: 1, tableId: 'tbl-t', guestCount: 1,
  }, d);
  addOrderItemCommand(db, {
    deviceId: 'POS-T', orderId: opened.orderId, name: 'Плов', quantity: 1, unitPrice: 30000,
  }, d);
  const paid1 = payOrderCommand(db, {
    deviceId: 'POS-T', orderId: opened.orderId, method: 'CASH', amount: 30000, cashAmount: 30000,
  }, d);
  assert.equal(paid1.status, ORDER_STATUS.PAID);
  const paid2 = payOrderCommand(db, {
    deviceId: 'POS-T', orderId: opened.orderId, method: 'CASH', amount: 30000, cashAmount: 30000,
  }, d);
  assert.equal(paid2.already, true);
  const cancel = cancelOrderCommand(db, { deviceId: 'POS-T', orderId: opened.orderId }, d);
  assert.equal(cancel.already, true);
  assert.equal(cancel.status, ORDER_STATUS.PAID);
  const outboxPays = db.prepare(
    `SELECT COUNT(*) AS c FROM outbox WHERE event_type = 'ORDER_PAY'`,
  ).get().c;
  assert.equal(outboxPays, 1);
  db.close();
});

test('UNKNOWN resolve ack does not create second print job', async () => {
  const db = await readyDb();
  const prints = createPrintJobRepo(db, {
    idFactory: (() => { let n = 0; return () => `unk-${++n}`; })(),
    clock: () => '2026-10-03T09:00:00.000Z',
  });
  const job = prints.insertPending({
    orderId: 'ord-x',
    kind: 'KITCHEN_SEND',
    printerName: 'Kitchen',
    items: [{ name: 'Стейк', qty: 1 }],
  });
  db.prepare(`UPDATE print_jobs SET status = ? WHERE id = ?`).run(PRINT_JOB_STATUS.UNKNOWN, job.id);
  resolvePrintJobCommand(db, { jobId: job.id, action: ACTIONS.ACK_PRINTED });
  assert.equal(prints.getById(job.id).status, PRINT_JOB_STATUS.PRINTED);
  assert.equal(
    db.prepare(`SELECT COUNT(*) AS c FROM print_jobs WHERE order_id = ?`).get('ord-x').c,
    1,
  );
  assert.equal(listUnresolvedPrintJobs(db).length, 0);
  db.close();
});

test('REQUEUE from UNKNOWN is the only path back to PENDING', async () => {
  const db = await readyDb();
  const prints = createPrintJobRepo(db, {
    idFactory: (() => { let n = 0; return () => `rq-${++n}`; })(),
    clock: () => '2026-10-03T09:00:00.000Z',
  });
  const job = prints.insertPending({
    orderId: 'ord-y',
    kind: 'KITCHEN_SEND',
    printerName: 'Kitchen',
    items: [{ name: 'Салат', qty: 2 }],
  });
  db.prepare(`UPDATE print_jobs SET status = ? WHERE id = ?`).run(PRINT_JOB_STATUS.UNKNOWN, job.id);
  resolvePrintJobCommand(db, { jobId: job.id, action: ACTIONS.REQUEUE });
  assert.equal(prints.getById(job.id).status, PRINT_JOB_STATUS.PENDING);
  assert.equal(
    db.prepare(`SELECT status FROM outbox`).all().length,
    0,
  );
  db.close();
});

test('full offline path open→add→update→send-kitchen outbox chain', async () => {
  const db = await readyDb();
  const d = deps('full');
  const { sendToKitchenCommand } = require('../electron/restaurant-offline/commands/index.cjs');

  const opened = openOrderCommand(db, {
    deviceId: 'POS-T', storeId: 1, tableId: 'tbl-t', guestCount: 2,
  }, d);
  const added = addOrderItemCommand(db, {
    deviceId: 'POS-T',
    orderId: opened.orderId,
    name: 'Шашлык',
    quantity: 1,
    unitPrice: 45000,
  }, d);
  updateOrderItemCommand(db, {
    deviceId: 'POS-T',
    orderId: opened.orderId,
    itemId: added.itemId,
    quantity: 2,
  }, d);
  const sent = sendToKitchenCommand(db, {
    deviceId: 'POS-T',
    storeId: 1,
    orderId: opened.orderId,
    tableId: 'tbl-t',
    printerName: 'Kitchen',
    items: [{ name: 'Шашлык', qty: 2 }],
  }, d);

  const types = db.prepare(`SELECT event_type FROM outbox ORDER BY created_at ASC`)
    .all()
    .map((r) => r.event_type);
  assert.deepEqual(types, [
    'ORDER_OPEN',
    'ORDER_ADD_ITEM',
    'ORDER_UPDATE_ITEM',
    'ORDER_SEND_KITCHEN',
  ]);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.PENDING,
  );
  assert.equal(
    db.prepare(`SELECT status FROM outbox WHERE id = ?`).get(sent.outboxId).status,
    OUTBOX_STATUS.PENDING,
  );
  db.close();
});

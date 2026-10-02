const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyRestaurantOfflineSchema,
  runInTransaction,
  createOrderRepo,
  createOrderItemRepo,
  createPrintJobRepo,
  createOutboxRepo,
} = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');
const {
  ORDER_STATUS,
  PRINT_JOB_STATUS,
  OUTBOX_STATUS,
  PRINT_JOB_KIND,
} = require('../electron/restaurant-offline/domain/index.cjs');

async function readyDb() {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  const now = '2026-10-03T01:00:00.000Z';
  db.prepare(`INSERT INTO devices(device_id, label, created_at) VALUES (?, ?, ?)`).run('POS-01', 't', now);
  db.prepare(`INSERT INTO floor_tables(id, store_id, name, updated_at) VALUES (?, ?, ?, ?)`).run(
    'tbl-1',
    1,
    'T1',
    now,
  );
  return db;
}

test('B2 TX commits order + print_job + outbox together', async () => {
  const db = await readyDb();
  let seq = 0;
  const idFactory = () => `id-${++seq}`;
  const clock = () => '2026-10-03T01:00:00.000Z';

  const result = runInTransaction(db, () => {
    const orders = createOrderRepo(db, { idFactory, clock });
    const items = createOrderItemRepo(db, { idFactory, clock });
    const prints = createPrintJobRepo(db, { idFactory, clock });
    const outbox = createOutboxRepo(db, { idFactory, clock, uuid: () => 'evt-tx-1' });

    const order = orders.insertOpen({ storeId: 1, tableId: 'tbl-1' });
    items.insert({ orderId: order.id, name: 'Кола', quantity: 2, unitPrice: 10000 });
    orders.transitionStatus(order.id, ORDER_STATUS.ACTIVE);
    const job = prints.insertPending({
      kind: PRINT_JOB_KIND.KITCHEN_SEND,
      orderId: order.id,
      printerName: 'Oshxona',
      items: [{ name: 'Кола', qty: 2 }],
    });
    const ev = outbox.enqueue({
      deviceId: 'POS-01',
      eventType: 'ORDER_SEND_KITCHEN',
      payload: { orderId: order.id, printJobId: job.id },
    });
    return { orderId: order.id, printJobId: job.id, outboxId: ev.id };
  });

  assert.equal(db.prepare(`SELECT status FROM orders WHERE id = ?`).get(result.orderId).status, ORDER_STATUS.ACTIVE);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(result.printJobId).status,
    PRINT_JOB_STATUS.PENDING,
  );
  assert.equal(
    db.prepare(`SELECT status FROM outbox WHERE id = ?`).get(result.outboxId).status,
    OUTBOX_STATUS.PENDING,
  );
  db.close();
});

test('B2 TX rolls back all writes on error', async () => {
  const db = await readyDb();
  let seq = 0;
  const idFactory = () => `rb-${++seq}`;
  const clock = () => '2026-10-03T01:00:00.000Z';

  assert.throws(() => {
    runInTransaction(db, () => {
      const orders = createOrderRepo(db, { idFactory, clock });
      const items = createOrderItemRepo(db, { idFactory, clock });
      const order = orders.insertOpen({ storeId: 1, tableId: 'tbl-1' });
      items.insert({ orderId: order.id, name: 'Кола', quantity: 2 });
      throw new Error('boom');
    });
  });

  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM orders`).get().c, 0);
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM order_items`).get().c, 0);
  db.close();
});

test('B2 print job repo refuses invalid transition', async () => {
  const db = await readyDb();
  const prints = createPrintJobRepo(db, {
    idFactory: () => 'pj-1',
    clock: () => '2026-10-03T01:00:00.000Z',
  });
  const job = prints.insertPending({
    kind: PRINT_JOB_KIND.KITCHEN_SEND,
    orderId: 'ord-x',
    printerName: 'Oshxona',
    items: [{ name: 'X', qty: 1 }],
  });
  // order_id FK: we didn't insert order — sql.js may not enforce FK by default.
  // Transition PENDING → PRINTED is illegal.
  assert.throws(() => prints.transition(job.id, PRINT_JOB_STATUS.PRINTED));
  prints.transition(job.id, PRINT_JOB_STATUS.PRINTING);
  prints.transition(job.id, PRINT_JOB_STATUS.UNKNOWN);
  assert.throws(() => prints.transition(job.id, PRINT_JOB_STATUS.PRINTING));
  db.close();
});

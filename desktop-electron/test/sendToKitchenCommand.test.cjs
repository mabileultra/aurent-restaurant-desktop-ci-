const test = require('node:test');
const assert = require('node:assert/strict');

const { applyRestaurantOfflineSchema } = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');
const { sendToKitchenCommand } = require('../electron/restaurant-offline/commands/index.cjs');
const {
  ORDER_STATUS,
  PRINT_JOB_STATUS,
  OUTBOX_STATUS,
} = require('../electron/restaurant-offline/domain/index.cjs');

async function readyDb() {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  const now = '2026-10-03T02:00:00.000Z';
  db.prepare(`INSERT INTO devices(device_id, label, created_at) VALUES (?, ?, ?)`).run('POS-01', 't', now);
  db.prepare(`INSERT INTO floor_tables(id, store_id, name, updated_at) VALUES (?, ?, ?, ?)`).run(
    'tbl-1',
    1,
    'T1',
    now,
  );
  return db;
}

test('C3 send-to-kitchen writes order+items+print+outbox in one TX', async () => {
  const db = await readyDb();
  let n = 0;
  const result = sendToKitchenCommand(
    db,
    {
      deviceId: 'POS-01',
      storeId: 1,
      tableId: 'tbl-1',
      tableLabel: 'T1',
      printerName: 'Oshxona',
      items: [{ name: 'Кола', qty: 2, unitPrice: 10000 }],
    },
    {
      idFactory: () => `c3-${++n}`,
      clock: () => '2026-10-03T02:00:00.000Z',
      uuid: () => 'evt-c3-1',
    },
  );

  assert.ok(result.orderId);
  assert.equal(result.clientEventId, 'evt-c3-1');
  assert.equal(db.prepare(`SELECT status FROM orders WHERE id = ?`).get(result.orderId).status, ORDER_STATUS.ACTIVE);
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM order_items`).get().c, 1);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(result.printJobId).status,
    PRINT_JOB_STATUS.PENDING,
  );
  const payload = JSON.parse(
    db.prepare(`SELECT payload_json FROM print_jobs WHERE id = ?`).get(result.printJobId).payload_json,
  );
  assert.equal(payload.items[0].qty, 2);
  assert.equal(
    db.prepare(`SELECT status FROM outbox WHERE id = ?`).get(result.outboxId).status,
    OUTBOX_STATUS.PENDING,
  );
  db.close();
});

test('C3 rolls back when printer missing', async () => {
  const db = await readyDb();
  assert.throws(() => sendToKitchenCommand(db, {
    deviceId: 'POS-01',
    storeId: 1,
    tableId: 'tbl-1',
    printerName: '',
    items: [{ name: 'Кола', qty: 1 }],
  }));
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM orders`).get().c, 0);
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM print_jobs`).get().c, 0);
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM outbox`).get().c, 0);
  db.close();
});

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

test('C3 soft-fail: missing printer still commits order+outbox, print FAILED', async () => {
  const db = await readyDb();
  let n = 0;
  const result = sendToKitchenCommand(
    db,
    {
      deviceId: 'POS-01',
      storeId: 1,
      tableId: 'tbl-1',
      printerName: '',
      items: [{ name: 'Кола', qty: 1, unitPrice: 10000 }],
    },
    {
      idFactory: () => `c3-soft-${++n}`,
      clock: () => '2026-10-03T02:00:00.000Z',
      uuid: () => 'evt-c3-soft',
    },
  );

  assert.equal(result.printOk, false);
  assert.equal(result.printError, 'kitchen_printer_not_configured');
  assert.equal(db.prepare(`SELECT status FROM orders WHERE id = ?`).get(result.orderId).status, ORDER_STATUS.ACTIVE);
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM order_items`).get().c, 1);
  const printRow = db.prepare(`SELECT status, last_error FROM print_jobs WHERE id = ?`).get(result.printJobId);
  assert.equal(printRow.status, PRINT_JOB_STATUS.FAILED);
  assert.equal(printRow.last_error, 'kitchen_printer_not_configured');
  assert.equal(
    db.prepare(`SELECT status FROM outbox WHERE id = ?`).get(result.outboxId).status,
    OUTBOX_STATUS.PENDING,
  );
  db.close();
});

test('C3 printOnServer skips local print_job (satellite → cashier relay)', async () => {
  const db = await readyDb();
  let n = 0;
  const result = sendToKitchenCommand(
    db,
    {
      deviceId: 'POS-MONO',
      storeId: 1,
      tableId: 'tbl-1',
      printerName: 'Shashlik',
      printOnServer: true,
      items: [{ name: 'Shashlik', qty: 1, unitPrice: 25000 }],
    },
    {
      idFactory: () => `c3-relay-${++n}`,
      clock: () => '2026-10-03T02:00:00.000Z',
      uuid: () => 'evt-c3-relay',
    },
  );

  assert.equal(result.printOk, true);
  assert.equal(result.printOnServer, true);
  assert.equal(result.printJobId, null);
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM print_jobs`).get().c, 0);
  const payload = JSON.parse(
    db.prepare(`SELECT payload_json FROM outbox WHERE id = ?`).get(result.outboxId).payload_json,
  );
  assert.equal(payload.printOnServer, true);
  assert.equal(payload.printerName, 'Shashlik');
  db.close();
});

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  SCHEMA_VERSION,
  REQUIRED_TABLES,
  applyRestaurantOfflineSchema,
  assertRestaurantOfflineSchema,
  listRestaurantOfflineTables,
} = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');

const {
  ORDER_STATUS,
  PRINT_JOB_STATUS,
  OUTBOX_STATUS,
  buildPrintJobPayload,
  PRINT_JOB_KIND,
  createClientEventId,
} = require('../electron/restaurant-offline/domain/index.cjs');

test('B1 schema migrates clean on empty db', async () => {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  const info = assertRestaurantOfflineSchema(db);
  assert.equal(info.schemaVersion, SCHEMA_VERSION);
  for (const name of REQUIRED_TABLES) {
    assert.ok(info.tables.includes(name), `missing table ${name}`);
  }
  db.close();
});

test('B1 schema is idempotent', async () => {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  applyRestaurantOfflineSchema(db);
  assert.equal(assertRestaurantOfflineSchema(db).schemaVersion, SCHEMA_VERSION);
  assert.equal(listRestaurantOfflineTables(db).length, REQUIRED_TABLES.length);
  db.close();
});

test('B1 vertical-slice rows fit schema (order + print_job + outbox)', async () => {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  const now = '2026-10-03T00:00:00.000Z';

  db.prepare(
    `INSERT INTO devices(device_id, label, created_at) VALUES (?, ?, ?)`,
  ).run('POS-01', 'test', now);

  db.prepare(
    `INSERT INTO floor_tables(id, store_id, name, updated_at) VALUES (?, ?, ?, ?)`,
  ).run('tbl-1', 1, 'T1', now);

  db.prepare(
    `INSERT INTO orders(id, store_id, table_id, status, opened_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run('ord-1', 1, 'tbl-1', ORDER_STATUS.OPEN, now, now);

  db.prepare(
    `INSERT INTO order_items(id, order_id, name, quantity, unit_price, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('item-1', 'ord-1', 'Кола', 2, 10000, 'OPEN', now, now);

  db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(ORDER_STATUS.ACTIVE, 'ord-1');

  const payload = buildPrintJobPayload({
    kind: PRINT_JOB_KIND.KITCHEN_SEND,
    orderId: 'ord-1',
    printerName: 'Oshxona',
    tableLabel: 'T1',
    items: [{ name: 'Кола', qty: 2 }],
    createdAt: now,
  });

  db.prepare(
    `INSERT INTO print_jobs(id, order_id, kind, printer_name, status, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    'pj-1',
    'ord-1',
    payload.kind,
    payload.printerName,
    PRINT_JOB_STATUS.PENDING,
    JSON.stringify(payload),
    now,
  );

  const ev = createClientEventId({ deviceId: 'POS-01', uuid: () => 'evt-1' });
  db.prepare(
    `INSERT INTO outbox(id, device_id, client_event_id, event_type, status, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    'ob-1',
    ev.deviceId,
    ev.clientEventId,
    'ORDER_SEND_KITCHEN',
    OUTBOX_STATUS.PENDING,
    JSON.stringify({ orderId: 'ord-1', printJobId: 'pj-1' }),
    now,
  );

  const order = db.prepare(`SELECT status FROM orders WHERE id = ?`).get('ord-1');
  const jobs = db.prepare(`SELECT status FROM print_jobs`).all();
  const outbox = db.prepare(`SELECT status FROM outbox`).all();
  assert.equal(order.status, ORDER_STATUS.ACTIVE);
  assert.equal(jobs[0].status, PRINT_JOB_STATUS.PENDING);
  assert.equal(outbox[0].status, OUTBOX_STATUS.PENDING);

  assert.throws(() => {
    db.prepare(
      `INSERT INTO outbox(id, device_id, client_event_id, event_type, status, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run('ob-2', ev.deviceId, ev.clientEventId, 'ORDER_SEND_KITCHEN', OUTBOX_STATUS.PENDING, '{}', now);
  });

  db.close();
});

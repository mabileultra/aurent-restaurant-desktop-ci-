const test = require('node:test');
const assert = require('node:assert/strict');

const { applyRestaurantOfflineSchema } = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');
const {
  openOrderCommand,
  addOrderItemCommand,
  toUiOrder,
} = require('../electron/restaurant-offline/commands/index.cjs');
const { ORDER_STATUS, OUTBOX_STATUS } = require('../electron/restaurant-offline/domain/index.cjs');

async function readyDb() {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  const now = '2026-10-03T07:00:00.000Z';
  db.prepare(`INSERT INTO devices(device_id, label, created_at) VALUES (?, ?, ?)`).run('POS-01', 't', now);
  db.prepare(`INSERT INTO floor_tables(id, store_id, name, updated_at) VALUES (?, ?, ?, ?)`).run(
    'tbl-1',
    1,
    'T1',
    now,
  );
  return db;
}

test('C1 open order writes OPEN + outbox', async () => {
  const db = await readyDb();
  let n = 0;
  const result = openOrderCommand(
    db,
    {
      deviceId: 'POS-01',
      storeId: 1,
      tableId: 'tbl-1',
      tableLabel: 'T1',
      guestCount: 2,
    },
    {
      idFactory: () => `c1-${++n}`,
      clock: () => '2026-10-03T07:00:00.000Z',
      uuid: () => 'evt-open-1',
    },
  );
  assert.equal(result.status, ORDER_STATUS.OPEN);
  assert.equal(db.prepare(`SELECT status FROM outbox WHERE id = ?`).get(result.outboxId).status, OUTBOX_STATUS.PENDING);
  const ui = toUiOrder(db, result.orderId);
  assert.equal(ui.guestCount, 2);
  assert.equal(ui._local, true);
  db.close();
});

test('C2 add item activates order and enqueues outbox', async () => {
  const db = await readyDb();
  let n = 0;
  const deps = {
    idFactory: () => `c2-${++n}`,
    clock: () => '2026-10-03T07:00:00.000Z',
    uuid: () => `evt-c2-${n}`,
  };
  const opened = openOrderCommand(db, {
    deviceId: 'POS-01',
    storeId: 1,
    tableId: 'tbl-1',
    guestCount: 1,
  }, deps);
  const added = addOrderItemCommand(db, {
    deviceId: 'POS-01',
    orderId: opened.orderId,
    name: 'Кола',
    quantity: 2,
    unitPrice: 10000,
  }, deps);
  assert.equal(added.order.status, 'OPEN'); // UI maps ACTIVE → OPEN
  assert.equal(added.order.items.length, 1);
  assert.equal(added.order.items[0].quantity, 2);
  assert.equal(
    db.prepare(`SELECT event_type FROM outbox WHERE id = ?`).get(added.outboxId).event_type,
    'ORDER_ADD_ITEM',
  );
  db.close();
});

test('update / cancel item / cancel order enqueue outbox', async () => {
  const db = await readyDb();
  let n = 0;
  const deps = {
    idFactory: () => `u-${++n}`,
    clock: () => '2026-10-03T07:00:00.000Z',
    uuid: () => `evt-u-${n}`,
  };
  const {
    updateOrderItemCommand,
    cancelOrderItemCommand,
    cancelOrderCommand,
  } = require('../electron/restaurant-offline/commands/index.cjs');

  const opened = openOrderCommand(db, {
    deviceId: 'POS-01',
    storeId: 1,
    tableId: 'tbl-1',
    guestCount: 1,
  }, deps);
  const added = addOrderItemCommand(db, {
    deviceId: 'POS-01',
    orderId: opened.orderId,
    name: 'Чай',
    quantity: 1,
    unitPrice: 5000,
  }, deps);

  const updated = updateOrderItemCommand(db, {
    deviceId: 'POS-01',
    orderId: opened.orderId,
    itemId: added.itemId,
    quantity: 3,
  }, deps);
  assert.equal(updated.order.items[0].quantity, 3);
  assert.equal(
    db.prepare(`SELECT event_type FROM outbox WHERE id = ?`).get(updated.outboxId).event_type,
    'ORDER_UPDATE_ITEM',
  );

  const cancelledItem = cancelOrderItemCommand(db, {
    deviceId: 'POS-01',
    orderId: opened.orderId,
    itemId: added.itemId,
  }, deps);
  assert.equal(cancelledItem.deleted, true);
  assert.equal(cancelledItem.order.items.length, 0);

  const added2 = addOrderItemCommand(db, {
    deviceId: 'POS-01',
    orderId: opened.orderId,
    name: 'Кофе',
    quantity: 1,
    unitPrice: 8000,
  }, deps);
  // mark as sent so cancel keeps row
  db.prepare(`UPDATE order_items SET status = 'SENT' WHERE id = ?`).run(added2.itemId);
  const refuse = cancelOrderItemCommand(db, {
    deviceId: 'POS-01',
    orderId: opened.orderId,
    itemId: added2.itemId,
  }, deps);
  assert.equal(refuse.deleted, false);
  assert.equal(refuse.order.items.find((i) => i.id === added2.itemId).itemStatus, 'CANCELLED');

  const cancelled = cancelOrderCommand(db, {
    deviceId: 'POS-01',
    orderId: opened.orderId,
  }, deps);
  assert.equal(cancelled.status, ORDER_STATUS.CANCELLED);
  assert.equal(
    db.prepare(`SELECT event_type FROM outbox WHERE id = ?`).get(cancelled.outboxId).event_type,
    'ORDER_CANCEL',
  );
  db.close();
});

test('pay order marks PAID and enqueues ORDER_PAY', async () => {
  const db = await readyDb();
  let n = 0;
  const deps = {
    idFactory: () => `p-${++n}`,
    clock: () => '2026-10-03T07:00:00.000Z',
    uuid: () => `evt-p-${n}`,
  };
  const { payOrderCommand } = require('../electron/restaurant-offline/commands/index.cjs');
  const opened = openOrderCommand(db, {
    deviceId: 'POS-01',
    storeId: 1,
    tableId: 'tbl-1',
    guestCount: 1,
  }, deps);
  addOrderItemCommand(db, {
    deviceId: 'POS-01',
    orderId: opened.orderId,
    name: 'Суп',
    quantity: 1,
    unitPrice: 20000,
  }, deps);
  const paid = payOrderCommand(db, {
    deviceId: 'POS-01',
    orderId: opened.orderId,
    method: 'CASH',
    amount: 20000,
    cashAmount: 20000,
  }, deps);
  assert.equal(paid.status, ORDER_STATUS.PAID);
  assert.equal(
    db.prepare(`SELECT event_type FROM outbox WHERE id = ?`).get(paid.outboxId).event_type,
    'ORDER_PAY',
  );
  db.close();
});

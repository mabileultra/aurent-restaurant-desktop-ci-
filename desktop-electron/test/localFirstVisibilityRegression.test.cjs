/**
 * Regression: monoblock punches must stay visible on floor + survive kitchen reorder
 * (the "каша" from logs: ACCEPTED outbox but empty cashier / split lines).
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const { applyRestaurantOfflineSchema } = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');
const { importRestaurantBootstrap } = require('../electron/restaurant-offline/db/bootstrap.cjs');
const { applyHubEvent } = require('../electron/restaurant-offline/hub/applyHubEvent.cjs');
const { buildHubSnapshot } = require('../electron/restaurant-offline/hub/hubSnapshot.cjs');
const { listLocalFloorSnapshot } = require('../electron/restaurant-offline/commands/listLocalCatalog.cjs');
const {
  openOrderCommand,
  addOrderItemCommand,
  sendToKitchenCommand,
  toUiOrder,
} = require('../electron/restaurant-offline/commands/index.cjs');
const { mergeHubSnapshot } = require('../electron/restaurant-offline/hub/mergeHubSnapshot.cjs');

async function readyDb() {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  const now = '2026-10-03T13:48:00.000Z';
  db.prepare(`INSERT INTO devices(device_id, label, created_at) VALUES (?, ?, ?)`).run('POS-MONO', 'm', now);
  importRestaurantBootstrap(db, {
    storeId: 55,
    categories: [{ id: 1, name: 'Напитки', sortOrder: 1, autoPrint: true, printPrinterName: 'Bar' }],
    menuItems: [{
      id: '48f69d70-62ca-4042-befd-a4de65ce0595',
      name: 'CHORTOQ 0.5 L',
      price: 14000,
      categoryId: 1,
    }],
    tables: [
      { id: 12, name: 'СТОЛ 12', code: '12', hallId: 1, hallName: 'NEW ZAL' },
      { id: 13, name: 'СТОЛ 13', code: '13', hallId: 1, hallName: 'NEW ZAL' },
    ],
  });
  return db;
}

test('monoblock open+add paints OCCUPIED with subtotal on local floor', async () => {
  const db = await readyDb();
  let n = 0;
  const deps = {
    idFactory: () => `vis-${++n}`,
    clock: () => '2026-10-03T13:48:12.000Z',
    uuid: () => `evt-vis-${n}`,
  };
  const opened = openOrderCommand(db, {
    deviceId: 'POS-MONO',
    storeId: 55,
    tableId: '13',
    tableLabel: 'СТОЛ 13',
    guestCount: 1,
  }, deps);
  addOrderItemCommand(db, {
    deviceId: 'POS-MONO',
    orderId: opened.orderId,
    name: 'CHORTOQ 0.5 L',
    quantity: 1,
    unitPrice: 14000,
    menuItemId: '48f69d70-62ca-4042-befd-a4de65ce0595',
  }, deps);

  const floor = listLocalFloorSnapshot(db, 55);
  const table = floor.halls[0].tables.find((t) => String(t.id) === '13');
  assert.ok(table);
  assert.equal(table.status, 'OCCUPIED');
  assert.equal(table.activeOrder.id, opened.orderId);
  assert.equal(table.activeOrder.subtotal, 14000);

  const addOut = db.prepare(
    `SELECT payload_json FROM outbox WHERE event_type = 'ORDER_ADD_ITEM' ORDER BY created_at DESC LIMIT 1`,
  ).get();
  const payload = JSON.parse(addOut.payload_json);
  assert.equal(String(payload.tableId), '13');
  assert.equal(Number(payload.storeId), 55);
  db.close();
});

test('after kitchen send, same dish merges — one line, pending send qty, hub snapshot exposes sentQuantity', async () => {
  const db = await readyDb();
  let n = 0;
  const deps = {
    idFactory: () => `re-${++n}`,
    clock: () => '2026-10-03T13:48:12.000Z',
    uuid: () => `evt-re-${n}`,
  };
  const opened = openOrderCommand(db, {
    deviceId: 'POS-MONO', storeId: 55, tableId: '13', guestCount: 1,
  }, deps);
  const first = addOrderItemCommand(db, {
    deviceId: 'POS-MONO',
    orderId: opened.orderId,
    name: 'CHORTOQ 0.5 L',
    quantity: 1,
    unitPrice: 14000,
    menuItemId: '48f69d70-62ca-4042-befd-a4de65ce0595',
  }, deps);
  sendToKitchenCommand(db, {
    deviceId: 'POS-MONO',
    storeId: 55,
    tableId: '13',
    orderId: opened.orderId,
    printerName: 'Bar',
    items: [{ id: first.itemId, name: 'CHORTOQ 0.5 L', qty: 1, menuItemId: '48f69d70-62ca-4042-befd-a4de65ce0595' }],
    itemIds: [first.itemId],
  }, deps);

  // Log bug: each punch after send created a NEW itemId — must merge.
  for (let i = 0; i < 4; i += 1) {
    const r = addOrderItemCommand(db, {
      deviceId: 'POS-MONO',
      orderId: opened.orderId,
      name: 'CHORTOQ 0.5 L',
      quantity: 1,
      unitPrice: 14000,
      menuItemId: '48f69d70-62ca-4042-befd-a4de65ce0595',
    }, deps);
    assert.equal(r.merged, true, `punch ${i + 2} must merge`);
    assert.equal(r.itemId, first.itemId);
  }

  const ui = toUiOrder(db, opened.orderId);
  assert.equal(ui.items.length, 1);
  assert.equal(ui.items[0].quantity, 5);
  assert.equal(ui.items[0].sentQuantity, 1);

  const floor = listLocalFloorSnapshot(db, 55);
  const table = floor.halls[0].tables.find((t) => String(t.id) === '13');
  assert.equal(table.activeOrder.subtotal, 70000);

  const snap = buildHubSnapshot(db, 55);
  const hubOrder = snap.orders.find((o) => o.id === opened.orderId);
  assert.ok(hubOrder);
  assert.equal(hubOrder.items.length, 1);
  assert.equal(hubOrder.items[0].sentQuantity, 1);
  assert.equal(hubOrder.subtotal, 70000);

  // Second send advances baseline — no duplicate lines.
  sendToKitchenCommand(db, {
    deviceId: 'POS-MONO',
    storeId: 55,
    tableId: '13',
    orderId: opened.orderId,
    printerName: 'Bar',
    items: [{ id: first.itemId, name: 'CHORTOQ 0.5 L', qty: 4, menuItemId: '48f69d70-62ca-4042-befd-a4de65ce0595' }],
    itemIds: [first.itemId],
  }, deps);
  const after = toUiOrder(db, opened.orderId);
  assert.equal(after.items.length, 1);
  assert.equal(after.items[0].sentQuantity, 5);
  assert.equal(after.items[0].quantity, 5);
  db.close();
});

test('waiter hub punches land on monoblock floor (phone → cashier visibility)', async () => {
  const db = await readyDb();
  const orderId = '370e07ff-2534-4cf5-bb66-4d030a500440';
  const itemId = 'a66e8bd9-213f-45a8-8a9a-18ac7278cac9';

  assert.equal(applyHubEvent(db, {
    eventType: 'ORDER_OPEN',
    deviceId: 'phone-1',
    clientEventId: 'p-open',
    storeId: 55,
    payload: { orderId, storeId: 55, tableId: '12', guestCount: 1 },
  }).outcome, 'ACCEPTED');

  assert.equal(applyHubEvent(db, {
    eventType: 'ORDER_ADD_ITEM',
    deviceId: 'phone-1',
    clientEventId: 'p-add',
    storeId: 55,
    payload: {
      orderId,
      itemId,
      storeId: 55,
      tableId: '12',
      name: 'CHORTOQ 0.5 L',
      quantity: 2,
      unitPrice: 14000,
      menuItemId: '48f69d70-62ca-4042-befd-a4de65ce0595',
    },
  }).outcome, 'ACCEPTED');

  const floor = listLocalFloorSnapshot(db, 55);
  const table = floor.halls[0].tables.find((t) => String(t.id) === '12');
  assert.equal(table.status, 'OCCUPIED');
  assert.equal(table.activeOrder.id, orderId);
  assert.equal(table.activeOrder.subtotal, 28000);

  // Peer PC pull: snapshot → merge keeps sent_quantity column happy.
  const snap = buildHubSnapshot(db, 55);
  const peer = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(peer);
  peer.prepare(`INSERT INTO devices(device_id, label, created_at) VALUES (?,?,?)`)
    .run('POS-PEER', 'p', '2026-10-03T13:48:00.000Z');
  importRestaurantBootstrap(peer, {
    storeId: 55,
    categories: [],
    menuItems: [],
    tables: [{ id: 12, name: 'СТОЛ 12', code: '12', hallId: 1, hallName: 'NEW ZAL' }],
  });
  const merged = mergeHubSnapshot(peer, snap);
  assert.ok(merged.mergedOrders >= 1);
  const peerFloor = listLocalFloorSnapshot(peer, 55);
  const peerTable = peerFloor.halls[0].tables.find((t) => String(t.id) === '12');
  assert.equal(peerTable.status, 'OCCUPIED');
  assert.equal(peerTable.activeOrder.subtotal, 28000);

  db.close();
  peer.close();
});

test('ADD without prior OPEN still materializes via hub (server-skip recovery path on station)', async () => {
  const db = await readyDb();
  const orderId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const itemId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  // Simulate lost OPEN: only ADD arrives (what cloud did when OPEN was skipped).
  assert.equal(applyHubEvent(db, {
    eventType: 'ORDER_ADD_ITEM',
    deviceId: 'phone-2',
    clientEventId: 'add-only',
    storeId: 55,
    payload: {
      orderId,
      itemId,
      storeId: 55,
      tableId: '13',
      name: 'CHORTOQ 0.5 L',
      quantity: 1,
      unitPrice: 14000,
    },
  }).outcome, 'ACCEPTED');

  // Desktop hub materialize for ADD is via addOrderItemCommand shell — applyHubEvent ADD
  // requires order. If open missing, addOrderItemCommand materializes shell.
  // applyHubEvent ORDER_ADD_ITEM calls addOrderItemCommand which materializes — verify.
  const row = db.prepare(`SELECT id, table_id, status FROM orders WHERE id = ?`).get(orderId);
  assert.ok(row, 'order must exist after ADD-only hub event');
  assert.equal(String(row.table_id), '13');
  const items = db.prepare(`SELECT COUNT(*) AS c FROM order_items WHERE order_id = ?`).get(orderId);
  assert.equal(items.c, 1);
  db.close();
});

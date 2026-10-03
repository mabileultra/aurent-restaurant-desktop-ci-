const test = require('node:test');
const assert = require('node:assert/strict');
const { applyRestaurantOfflineSchema } = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');
const { applyHubEvent } = require('../electron/restaurant-offline/hub/applyHubEvent.cjs');
const { createLanHubServer } = require('../electron/restaurant-offline/hub/lanHubServer.cjs');

test('hub applies ORDER_OPEN + ADD + SEND', async () => {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  db.prepare('INSERT INTO devices(device_id, label, created_at) VALUES (?,?,?)')
    .run('phone-1', 'p', '2026-01-01T00:00:00.000Z');

  const orderId = '11111111-1111-1111-1111-111111111111';
  const open = applyHubEvent(db, {
    eventType: 'ORDER_OPEN',
    deviceId: 'phone-1',
    clientEventId: 'e1',
    storeId: 1,
    payload: { orderId, storeId: 1, tableId: '5', guestCount: 2 },
  });
  assert.equal(open.outcome, 'ACCEPTED');

  const add = applyHubEvent(db, {
    eventType: 'ORDER_ADD_ITEM',
    deviceId: 'phone-1',
    clientEventId: 'e2',
    storeId: 1,
    payload: {
      orderId, storeId: 1, name: 'Лагман', quantity: 1, unitPrice: 12000, menuItemId: 'm1',
    },
  });
  assert.equal(add.outcome, 'ACCEPTED');

  const send = applyHubEvent(db, {
    eventType: 'ORDER_SEND_KITCHEN',
    deviceId: 'phone-1',
    clientEventId: 'e3',
    storeId: 1,
    payload: {
      orderId,
      storeId: 1,
      tableId: '5',
      items: [{ name: 'Лагман', qty: 1, unitPrice: 12000 }],
      printerName: '',
    },
  });
  assert.equal(send.outcome, 'ACCEPTED');

  const again = applyHubEvent(db, {
    eventType: 'ORDER_OPEN',
    deviceId: 'phone-1',
    clientEventId: 'e1',
    storeId: 1,
    payload: { orderId, storeId: 1, tableId: '5' },
  });
  assert.equal(again.outcome, 'ALREADY_PROCESSED');
});

test('waiter SEND via hub queues local print when category printer set', async () => {
  const { importRestaurantBootstrap } = require('../electron/restaurant-offline/db/bootstrap.cjs');

  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  db.prepare('INSERT INTO devices(device_id, label, created_at) VALUES (?,?,?)')
    .run('phone-3', 'w', '2026-01-01T00:00:00.000Z');
  importRestaurantBootstrap(db, {
    storeId: 1,
    categories: [{
      id: 10,
      name: 'Кухня',
      sortOrder: 1,
      autoPrint: true,
      printPrinterName: 'KitchenPOS',
    }],
    menuItems: [],
    tables: [{ id: 1, name: '1', code: '1', hallId: 1, hallName: 'Z' }],
  });

  const orderId = '33333333-3333-3333-3333-333333333333';
  applyHubEvent(db, {
    eventType: 'ORDER_OPEN',
    deviceId: 'phone-3',
    clientEventId: 'p-open',
    storeId: 1,
    payload: { orderId, storeId: 1, tableId: '1' },
  });
  const send = applyHubEvent(db, {
    eventType: 'ORDER_SEND_KITCHEN',
    deviceId: 'phone-3',
    clientEventId: 'p-send',
    storeId: 1,
    payload: {
      orderId,
      storeId: 1,
      tableId: '1',
      printOnServer: true,
      printerName: '',
      items: [{ name: 'Плов', qty: 1, unitPrice: 30000 }],
    },
  });
  assert.equal(send.outcome, 'ACCEPTED');
  const job = db.prepare(
    `SELECT printer_name, status FROM print_jobs WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`,
  ).get(orderId);
  assert.ok(job, 'print job created on station');
  assert.equal(job.printer_name, 'KitchenPOS');
  assert.equal(job.status, 'PENDING');
});

test('waiter hub punch paints OCCUPIED on cashier floor snapshot', async () => {
  const { importRestaurantBootstrap } = require('../electron/restaurant-offline/db/bootstrap.cjs');
  const { listLocalFloorSnapshot } = require('../electron/restaurant-offline/commands/listLocalCatalog.cjs');
  const { buildHubSnapshot } = require('../electron/restaurant-offline/hub/hubSnapshot.cjs');

  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  db.prepare('INSERT INTO devices(device_id, label, created_at) VALUES (?,?,?)')
    .run('phone-2', 'w', '2026-01-01T00:00:00.000Z');
  importRestaurantBootstrap(db, {
    storeId: 1,
    categories: [],
    menuItems: [],
    tables: [{
      id: 6,
      name: 'СТОЛ 6',
      code: 'СТОЛ 6',
      hallId: 1,
      hallName: 'Зал',
    }],
  });

  const orderId = '22222222-2222-2222-2222-222222222222';
  assert.equal(applyHubEvent(db, {
    eventType: 'ORDER_OPEN',
    deviceId: 'phone-2',
    clientEventId: 'w-open',
    storeId: 1,
    payload: { orderId, storeId: 1, tableId: '6', guestCount: 1, waiterId: '77' },
  }).outcome, 'ACCEPTED');
  assert.equal(applyHubEvent(db, {
    eventType: 'ORDER_ADD_ITEM',
    deviceId: 'phone-2',
    clientEventId: 'w-add',
    storeId: 1,
    payload: {
      orderId, storeId: 1, name: 'Плов', quantity: 2, unitPrice: 30000, menuItemId: 'm-plov',
    },
  }).outcome, 'ACCEPTED');

  const floor = listLocalFloorSnapshot(db, 1);
  const table = floor.halls[0].tables.find((t) => String(t.id) === '6' || t.code === 'СТОЛ 6');
  assert.ok(table, 'table 6 present');
  assert.equal(table.status, 'OCCUPIED');
  assert.equal(table.activeOrder.id, orderId);
  assert.equal(String(table.activeOrder.waiterUserId), '77');

  const snap = buildHubSnapshot(db, 1);
  const hubOrder = snap.orders.find((o) => o.id === orderId);
  assert.ok(hubOrder);
  assert.equal(hubOrder.items.length, 1);
  assert.equal(hubOrder.items[0].name, 'Плов');
  assert.equal(hubOrder.items[0].quantity, 2);
});

test('lan hub health + snapshot respond', async () => {
  const hub = createLanHubServer({
    port: 18787,
    getMeta: () => ({ storeId: 1, deviceId: 'POS' }),
    getSnapshot: async () => ({ storeId: 1, orders: [], floor: { halls: [] }, menuItems: [] }),
    applyEvent: async () => ({ outcome: 'ACCEPTED' }),
  });
  const info = await hub.start();
  assert.equal(info.listening, true);
  const res = await fetch(`http://127.0.0.1:18787/hub/health`);
  const json = await res.json();
  assert.equal(json.ok, true);
  assert.equal(json.storeId, 1);
  assert.equal(json.service, 'pos-rst-hub');
  const snapRes = await fetch(`http://127.0.0.1:18787/hub/snapshot`);
  const snap = await snapRes.json();
  assert.equal(snap.storeId, 1);
  await hub.stop();
});

test('hub snapshot + merge roundtrip', async () => {
  const { buildHubSnapshot } = require('../electron/restaurant-offline/hub/hubSnapshot.cjs');
  const { mergeHubSnapshot } = require('../electron/restaurant-offline/hub/mergeHubSnapshot.cjs');
  const { createLocalMenuItemCommand } = require('../electron/restaurant-offline/commands/createLocalMenuItemCommand.cjs');

  const src = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(src);
  src.prepare('INSERT INTO devices(device_id, label, created_at) VALUES (?,?,?)')
    .run('pos-1', 'p', '2026-01-01T00:00:00.000Z');

  applyHubEvent(src, {
    eventType: 'ORDER_OPEN',
    deviceId: 'pos-1',
    clientEventId: 'o1',
    storeId: 1,
    payload: { orderId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', storeId: 1, tableId: '7' },
  });
  createLocalMenuItemCommand(src, {
    deviceId: 'pos-1',
    storeId: 1,
    name: 'Плов',
    price: 25000,
    id: 'local-plov-1',
  });

  const snap = buildHubSnapshot(src, 1);
  assert.ok(snap.orders.length >= 1);
  assert.ok(snap.menuItems.some((m) => m.name === 'Плов'));

  const dst = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(dst);
  const merged = mergeHubSnapshot(dst, snap);
  assert.ok(merged.mergedOrders >= 1);
  const floor = require('../electron/restaurant-offline/commands/listLocalCatalog.cjs')
    .listLocalMenuItems(dst, 1);
  assert.ok(floor.some((m) => m.name === 'Плов'));
});

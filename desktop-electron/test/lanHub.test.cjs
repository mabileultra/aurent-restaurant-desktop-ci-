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

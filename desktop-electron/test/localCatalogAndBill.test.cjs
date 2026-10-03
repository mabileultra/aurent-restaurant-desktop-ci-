const test = require('node:test');
const assert = require('node:assert/strict');

const { applyRestaurantOfflineSchema } = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');
const { importRestaurantBootstrap } = require('../electron/restaurant-offline/db/bootstrap.cjs');
const {
  listLocalMenuItems,
  listLocalFloorSnapshot,
} = require('../electron/restaurant-offline/commands/listLocalCatalog.cjs');
const { openOrderCommand } = require('../electron/restaurant-offline/commands/openOrderCommand.cjs');
const { addOrderItemCommand } = require('../electron/restaurant-offline/commands/addOrderItemCommand.cjs');
const { requestBillCommand } = require('../electron/restaurant-offline/commands/requestBillCommand.cjs');

async function readyDb() {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  const now = '2026-10-03T07:00:00.000Z';
  db.prepare(`INSERT INTO devices(device_id, label, created_at) VALUES (?, ?, ?)`).run('POS-01', 't', now);
  return db;
}

test('listLocalMenuItems + floor from bootstrap', async () => {
  const db = await readyDb();
  importRestaurantBootstrap(db, {
    storeId: 1,
    categories: [{ id: 10, name: 'Еда', sortOrder: 1 }],
    menuItems: [{ id: 100, categoryId: 10, name: 'Лагман', price: 12000 }],
    tables: [{
      id: 5,
      name: 'СТОЛ 5',
      code: 'СТОЛ 5',
      zoneName: 'Tashqari 1',
      hallId: 2,
      hallName: 'Tashqari 1',
    }],
  });
  const menu = listLocalMenuItems(db, 1);
  assert.equal(menu.length, 1);
  assert.equal(menu[0].name, 'Лагман');
  const floor = listLocalFloorSnapshot(db, 1);
  assert.equal(floor.halls.length, 1);
  assert.equal(floor.halls[0].tables[0].code, 'СТОЛ 5');
  assert.equal(floor.halls[0].tables[0].status, 'FREE');
});

test('requestBill → BILLING UI status', async () => {
  const db = await readyDb();
  const opened = openOrderCommand(db, {
    deviceId: 'POS-01',
    storeId: 1,
    tableId: '5',
    guestCount: 1,
  });
  addOrderItemCommand(db, {
    deviceId: 'POS-01',
    orderId: opened.orderId,
    storeId: 1,
    name: 'Лагман',
    quantity: 1,
    unitPrice: 12000,
  });
  const bill = requestBillCommand(db, { deviceId: 'POS-01', orderId: opened.orderId });
  assert.equal(bill.status, 'BILLING');
  assert.equal(bill.order.status, 'BILLING');
});

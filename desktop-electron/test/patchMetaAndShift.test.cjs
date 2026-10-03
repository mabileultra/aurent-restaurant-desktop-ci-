const test = require('node:test');
const assert = require('node:assert/strict');
const { applyRestaurantOfflineSchema } = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');
const { openOrderCommand } = require('../electron/restaurant-offline/commands/openOrderCommand.cjs');
const { addOrderItemCommand } = require('../electron/restaurant-offline/commands/addOrderItemCommand.cjs');
const { patchOrderMetaCommand } = require('../electron/restaurant-offline/commands/patchOrderMetaCommand.cjs');
const { getLocalShift, saveLocalShift } = require('../electron/restaurant-offline/commands/localShiftCache.cjs');

test('patch discount guests waiter + shift cache', async () => {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  db.prepare('INSERT INTO devices(device_id, label, created_at) VALUES (?,?,?)')
    .run('POS-01', 't', '2026-01-01T00:00:00.000Z');
  const opened = openOrderCommand(db, {
    deviceId: 'POS-01', storeId: 1, tableId: '5', guestCount: 1,
  });
  addOrderItemCommand(db, {
    deviceId: 'POS-01', orderId: opened.orderId, name: 'X', quantity: 1, unitPrice: 1,
  });
  const d = patchOrderMetaCommand(db, {
    deviceId: 'POS-01', orderId: opened.orderId, patch: 'DISCOUNT', discountAmount: 500,
  });
  assert.equal(d.order.discountAmount, 500);
  const g = patchOrderMetaCommand(db, {
    deviceId: 'POS-01', orderId: opened.orderId, patch: 'GUESTS', guestCount: 3, childrenCount: 1,
  });
  assert.equal(g.order.guestCount, 3);
  assert.equal(g.order.childrenCount, 1);
  const w = patchOrderMetaCommand(db, {
    deviceId: 'POS-01', orderId: opened.orderId, patch: 'WAITER', waiterId: 'w-1',
  });
  assert.equal(w.order.waiterUserId, 'w-1');
  saveLocalShift(db, 1, { id: 'sh1', status: 'OPEN' });
  assert.equal(getLocalShift(db, 1).id, 'sh1');
});

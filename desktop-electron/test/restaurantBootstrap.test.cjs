const test = require('node:test');
const assert = require('node:assert/strict');
const { applyRestaurantOfflineSchema } = require('../electron/restaurant-offline/db/migrate.cjs');
const {
  importRestaurantBootstrap,
  getRestaurantBootstrapStatus,
} = require('../electron/restaurant-offline/db/bootstrap.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');

test('B3 bootstrap imports categories/items/tables', async () => {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  const result = importRestaurantBootstrap(db, {
    storeId: 7,
    syncedAt: '2026-10-03T06:00:00.000Z',
    categories: [{ id: 'c1', name: 'Напитки', autoPrint: true, printPrinterName: 'KASSA' }],
    menuItems: [{ id: 'm1', categoryId: 'c1', name: 'Кола', price: 10000 }],
    tables: [{ id: 't1', name: 'T1', zoneName: 'Зал' }],
  });
  assert.equal(result.ok, true);
  assert.equal(result.menuItems, 1);
  const status = getRestaurantBootstrapStatus(db);
  assert.equal(status.bootstrapReady, true);
  assert.equal(status.storeId, 7);
  assert.equal(status.menuItemCount, 1);
  assert.equal(status.tableCount, 1);
  db.close();
});

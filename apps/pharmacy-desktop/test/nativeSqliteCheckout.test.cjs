const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createRequire } = require('module');

const root = path.join(__dirname, '..');
const requireFromRoot = createRequire(path.join(root, 'package.json'));
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-native-offline-'));

const electronPath = requireFromRoot.resolve('electron');
require.cache[electronPath] = {
  id: electronPath,
  filename: electronPath,
  loaded: true,
  exports: {
    app: {
      getPath: () => tmpDir,
      isPackaged: false,
      getAppPath: () => root,
    },
    ipcMain: { handle: () => {} },
  },
};

test('native sqlite checkout works (default engine path)', async (t) => {
  let betterSqlite3 = true;
  try {
    require('better-sqlite3');
  } catch {
    betterSqlite3 = false;
  }
  if (!betterSqlite3) {
    t.skip('better-sqlite3 not installed');
    return;
  }

  process.env.AURENT_OFFLINE_ENGINE = 'native';
  const connection = require('../electron/offline/db/connection.cjs');
  await connection.resetConnectionForTests({ userDataDir: tmpDir });
  const localDb = require('../electron/offline/index.cjs');
  const { completeLocalCheckout } = require('../electron/offline/checkout.cjs');

  await connection.getDb();
  assert.equal(connection.getOfflineEngineName(), 'native');

  const imported = await localDb.importBootstrap({
    storeId: 7,
    storeName: 'Native Store',
    syncedAt: new Date().toISOString(),
    categories: [{ id: 1, name: 'A' }],
    products: [
      {
        id: 101,
        name: 'Товар',
        barcode: '4600001',
        sellingPrice: 1500,
        stockQuantity: 10,
        categoryId: 1,
        unitCode: 'PCS',
      },
    ],
  });
  assert.equal(imported.ok, true);

  const checkout = await completeLocalCheckout({
    storeId: 7,
    cashierId: '42',
    cashierName: 'Кассир',
    storeName: 'Native Store',
    payload: {
      storeId: 7,
      paymentMethod: 'CASH',
      receiptType: 'SALE',
      items: [{ productId: 101, quantity: 1, unitPrice: 1500, discount: 0 }],
    },
    response: {
      id: 'sale-native-1',
      receiptNumber: 'OFF-NATIVE-0001',
      createdAt: new Date().toISOString(),
      totalAmount: 1500,
      cashAmount: 1500,
      cardAmount: 0,
      offlinePendingSync: true,
      status: 'COMPLETED',
    },
    stockLines: [{ productId: 101, quantity: 1 }],
  });
  assert.ok(checkout.clientSaleId);

  const pending = await localDb.listPendingSales();
  assert.ok(pending.some((row) => row.clientSaleId === checkout.clientSaleId));

  delete process.env.AURENT_OFFLINE_ENGINE;
  await connection.resetConnectionForTests({ userDataDir: tmpDir });
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

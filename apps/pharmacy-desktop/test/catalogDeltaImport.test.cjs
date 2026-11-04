const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createRequire } = require('module');

const root = path.join(__dirname, '..');
const requireFromRoot = createRequire(path.join(root, 'package.json'));
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-catalog-delta-'));

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

process.env.AURENT_OFFLINE_ENGINE = 'sqljs';

test('catalog delta upserts, removes, and rejects fullReset flag', async () => {
  const connection = require('../electron/offline/db/connection.cjs');
  await connection.resetConnectionForTests({ userDataDir: tmpDir });
  const localDb = require('../electron/offline/index.cjs');

  await localDb.importBootstrap({
    storeId: 7,
    storeName: 'Delta Store',
    syncedAt: '2026-10-30T00:00:00Z',
    categories: [
      { id: 1, name: 'OldCat' },
      { id: 2, name: 'KeepMe' },
    ],
    products: [
      {
        id: 'p-keep',
        name: 'Keep',
        barcode: '100',
        sellingPrice: 10,
        stockQuantity: 5,
        categoryId: 1,
        active: true,
      },
      {
        id: 'p-gone',
        name: 'Gone',
        barcode: '200',
        sellingPrice: 20,
        stockQuantity: 1,
        categoryId: 1,
        active: true,
      },
    ],
  });

  const rejected = await localDb.importCatalogDelta({ fullReset: true });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.fullReset, true);

  const applied = await localDb.importCatalogDelta({
    storeId: 7,
    storeName: 'Delta Store',
    syncedAt: '2026-10-30T01:00:00Z',
    fullReset: false,
    categories: [
      { id: 2, name: 'KeepMe' },
      { id: 3, name: 'NewCat' },
    ],
    products: [
      {
        id: 'p-keep',
        name: 'Keep Updated',
        barcode: '100',
        sellingPrice: 15,
        stockQuantity: 4,
        categoryId: 2,
        active: true,
      },
      {
        id: 'p-new',
        name: 'Brand New',
        barcode: '300',
        sellingPrice: 30,
        stockQuantity: 2,
        categoryId: 3,
        active: true,
      },
    ],
    removedProductIds: ['p-gone'],
  });

  assert.equal(applied.ok, true);
  assert.equal(applied.upserted, 2);
  assert.equal(applied.removed, 1);

  const status = await localDb.getBootstrapStatus();
  assert.equal(status.lastCatalogSyncAt, '2026-10-30T01:00:00Z');
  assert.equal(Number(status.productCount), 2);

  const kept = await localDb.getProductById('p-keep');
  assert.equal(kept.name, 'Keep Updated');
  assert.equal(Number(kept.sellingPrice), 15);

  const created = await localDb.getProductByBarcode('300');
  assert.ok(created);
  assert.equal(created.id, 'p-new');

  const gone = await localDb.getProductById('p-gone');
  assert.equal(gone, null);

  const cats = await localDb.listCategories();
  const names = cats.map((c) => c.name).sort();
  assert.deepEqual(names, ['KeepMe', 'NewCat']);
});

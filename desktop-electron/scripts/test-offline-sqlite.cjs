#!/usr/bin/env node
/**
 * Smoke-тесты офлайн SQLite в desktop-electron.
 * Запуск: node scripts/test-offline-sqlite.cjs
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createRequire } = require('module');

const root = path.join(__dirname, '..');
const requireFromRoot = createRequire(path.join(root, 'package.json'));
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-electron-offline-'));

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
    ipcMain: {
      handle: () => {},
    },
  },
};

const localDb = require('../electron/offline/index.cjs');
const { persistDb } = require('../electron/offline/db/connection.cjs');
const { completeLocalCheckout } = require('../electron/offline/checkout.cjs');
const { registerOfflineIpc } = require('../electron/offline/ipc.cjs');
const preloadSrc = fs.readFileSync(path.join(root, 'electron/preload.js'), 'utf8');
const mainSrc = fs.readFileSync(path.join(root, 'electron/main.js'), 'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      passed += 1;
      console.log(`  ✓ ${name}`);
    })
    .catch((err) => {
      failed += 1;
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
    });
}

console.log('desktop-electron — offline smoke\n');
console.log(`temp DB: ${tmpDir}\n`);

async function run() {
  await test('wiring: preload exposes offlineGetStatus', () => {
    assert.match(preloadSrc, /offlineGetStatus:\s*\(\)\s*=>\s*invoke\('offline:get-status'\)/);
    assert.match(preloadSrc, /offlineImportBootstrap:/);
    assert.match(preloadSrc, /offlineCompleteCheckout:/);
  });

  await test('wiring: main registers offline IPC + prewarm', () => {
    assert.match(mainSrc, /registerOfflineIpc/);
    assert.match(mainSrc, /offline\/index\.cjs/);
    assert.match(mainSrc, /actuator\/health/);
  });

  await test('wiring: bootstrap IPC timeout 60s', () => {
    const ipcSrc = fs.readFileSync(path.join(root, 'electron/offline/ipc.cjs'), 'utf8');
    assert.match(ipcSrc, /BOOTSTRAP_IPC_TIMEOUT_MS\s*=\s*60_000/);
    assert.match(ipcSrc, /offline:import-bootstrap[\s\S]*BOOTSTRAP_IPC_TIMEOUT_MS/);
  });

  await test('wiring: registerOfflineIpc is callable', () => {
    assert.equal(typeof registerOfflineIpc, 'function');
    registerOfflineIpc(() => ({ apiHealthUrl: 'http://127.0.0.1/health' }), async () => false);
  });

  await test('SQLite: importBootstrap + canSellOffline fields', async () => {
    const result = await localDb.importBootstrap({
      storeId: 7,
      storeName: 'Test Store',
      syncedAt: new Date().toISOString(),
      categories: [{ id: 1, name: 'A', parentId: null, sortOrder: 1 }],
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
    assert.equal(result.ok, true);
    assert.ok(result.productCount >= 1);

    const status = await localDb.getBootstrapStatus();
    assert.equal(Number(status.storeId), 7);
    assert.equal(status.bootstrapReady, true);
    assert.ok(Number(status.productCount) >= 1);
  });

  await test('SQLite: поиск и штрихкод', async () => {
    const byBarcode = await localDb.getProductByBarcode('4600001');
    assert.ok(byBarcode);
    assert.equal(Number(byBarcode.id), 101);

    const found = await localDb.searchProducts({ q: 'Товар', limit: 10 });
    assert.ok(Array.isArray(found));
    assert.ok(found.some((p) => Number(p.id) === 101));
  });

  await test('SQLite: смена + completeLocalCheckout', async () => {
    const checkout = await completeLocalCheckout({
      storeId: 7,
      cashierId: '42',
      cashierName: 'Кассир',
      storeName: 'Test Store',
      payload: {
        storeId: 7,
        paymentMethod: 'CASH',
        receiptType: 'SALE',
        items: [{ productId: 101, quantity: 1, unitPrice: 1500, discount: 0 }],
      },
      response: {
        id: 'sale-smoke-1',
        receiptNumber: 'OFF-SMOKE-0001',
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
    assert.ok(checkout.shiftId);

    const pending = await localDb.listPendingSales();
    assert.ok(pending.some((s) => s.clientSaleId === checkout.clientSaleId));
    persistDb();
  });

  await test('sql.js wasm exists', () => {
    const wasm = path.join(root, 'node_modules/sql.js/dist/sql-wasm.wasm');
    assert.ok(fs.existsSync(wasm), `missing ${wasm}`);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.exit(failed ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

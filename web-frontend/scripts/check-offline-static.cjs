#!/usr/bin/env node
/**
 * Static checks for web offline toggle / bridge hardening.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('web-frontend — offline static checks\n');

const bridge = read('src/services/offline/desktopOfflineBridge.js');
const sync = read('src/services/offline/offlineSyncService.js');
const status = read('src/features/cashier/hooks/useOfflineStatus.js');
const aside = read('src/components/layout/cashier/bottom-nav/CashierBottomNavAside.jsx');
const menu = read('src/features/cashier/components/desktop-menu/CashierDesktopMenuConnectivity.jsx');
const start = fs.readFileSync(
  path.join(root, '../scripts/start-cashier-desktop.sh'),
  'utf8',
);

test('bridge: bootstrap import timeout 60s', () => {
  assert.match(bridge, /OFFLINE_BOOTSTRAP_IPC_TIMEOUT_MS\s*=\s*60_000/);
  assert.match(bridge, /offlineImportBootstrap[\s\S]*OFFLINE_BOOTSTRAP_IPC_TIMEOUT_MS/);
});

test('bridge: isDesktopOfflineBridge requires offlineGetStatus', () => {
  assert.match(bridge, /offlineGetStatus === 'function'/);
});

test('sync: importBootstrap checks ok === false', () => {
  assert.match(sync, /imported\.ok === false/);
});

test('toggle: no bridge → desktopBridgeRequired', () => {
  assert.match(status, /desktopBridgeRequired/);
  assert.match(status, /!isDesktopOfflineBridge\(\)/);
});

test('toggle: always tries refreshCatalogBootstrap when not ready', () => {
  assert.match(status, /refreshCatalogBootstrap\(storeId,\s*\{\s*force:\s*true/);
  assert.doesNotMatch(status, /st0\.apiOnline/);
});

test('UI: dock is status-only; catalog refresh stays in desktop menu', () => {
  const dock = read('src/features/cashier/components/OfflineStatusDock.jsx');
  assert.match(aside, /OfflineStatusDock/);
  assert.doesNotMatch(dock, /showRefreshCatalog|refreshCatalog|RefreshCw/);
  assert.match(menu, /status\.canToggle/);
  assert.match(menu, /refreshCatalog/);
});

test('toggle: canToggle allows forceOffline without bridge gate', () => {
  assert.match(status, /canToggle = Boolean\(\s*forceOfflineMode\s*\|\|\s*offlineAllowed\s*\)/);
});

test('status: preparing only while catalogBusy (not forever)', () => {
  assert.match(status, /catalogBusy/);
  assert.match(status, /desktopBridgeRequired/);
  assert.match(status, /catalogNotReady/);
  assert.doesNotMatch(
    status,
    /else if \(!bootstrapReady && apiOnline\) \{\s*message = t\('offline\.preparingCatalog'\)/,
  );
});

test('connectivity: sets syncingCatalog during initial sync', () => {
  const conn = read('src/hooks/useOfflineConnectivity.js');
  assert.match(conn, /setSyncingCatalog\(true\)/);
  assert.match(conn, /catalogResult\?\.reason === 'error'/);
});

test('sync: runCatalogSyncIfNeeded keeps error message', () => {
  assert.match(sync, /reason: 'error',\s*error/);
});

test('start script prefers aurent-cashier-desktop', () => {
  const aurentIdx = start.indexOf('aurent-cashier-desktop');
  const stubIdx = start.indexOf('desktop-electron');
  assert.ok(aurentIdx > -1 && stubIdx > -1);
  assert.ok(aurentIdx < stubIdx, 'aurent must be preferred before desktop-electron');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

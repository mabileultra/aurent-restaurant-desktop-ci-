#!/usr/bin/env node
/**
 * Проверка offline/online логики кассы.
 * node scripts/verify-offline-connectivity.mjs
 */

import {
  canFallbackToOfflineCheckout,
  catalogMatchesStore,
  hasLocalPosCatalog,
  isCatalogStoreMismatch,
  isConnectivityOfflineLike,
  shouldPreferLocalCheckout,
} from '../src/services/offline/connectivityRules.js';

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

const storeA = { bootstrapReady: true, canSellOffline: true, productCount: 100, storeId: 5 };
const storeB = { bootstrapReady: true, canSellOffline: true, productCount: 100, storeId: 9 };
const emptyCatalog = { bootstrapReady: false, canSellOffline: false, productCount: 0, storeId: null };

const desktopCtx = { isDesktop: true, offlineAllowed: true };

console.log('Aurent — verify offline connectivity logic\n');

test('онлайн + локальный каталог → оплата через API (не local-first)', () => {
  if (
    shouldPreferLocalCheckout({
      ...desktopCtx,
      offlineLike: false,
      state: storeA,
      storeId: 5,
    })
  ) {
    throw new Error('must not prefer local checkout when online');
  }
});

test('офлайн + каталог своего магазина → local-first', () => {
  if (
    !shouldPreferLocalCheckout({
      ...desktopCtx,
      offlineLike: true,
      state: storeA,
      storeId: 5,
    })
  ) {
    throw new Error('expected local checkout when offline with matching catalog');
  }
});

test('офлайн + каталог чужого магазина → не local-first', () => {
  if (
    shouldPreferLocalCheckout({
      ...desktopCtx,
      offlineLike: true,
      state: storeB,
      storeId: 5,
    })
  ) {
    throw new Error('must not checkout with mismatched catalog store');
  }
});

test('офлайн без каталога → не local-first', () => {
  if (
    shouldPreferLocalCheckout({
      ...desktopCtx,
      offlineLike: true,
      state: emptyCatalog,
      storeId: 5,
    })
  ) {
    throw new Error('must not checkout without catalog');
  }
});

test('онлайн API fail → fallback checkout если есть каталог', () => {
  if (
    !canFallbackToOfflineCheckout({
      ...desktopCtx,
      state: storeA,
      storeId: 5,
    })
  ) {
    throw new Error('expected checkout fallback with matching catalog');
  }
});

test('forceOfflineMode → offlineLike без сети', () => {
  if (
    !isConnectivityOfflineLike({
      forceOfflineMode: true,
      offlineMode: false,
      apiOnline: true,
    })
  ) {
    throw new Error('forceOfflineMode must imply offlineLike');
  }
});

test('forceOfflineMode → local-first при каталоге', () => {
  if (
    !shouldPreferLocalCheckout({
      ...desktopCtx,
      state: { ...storeA, forceOfflineMode: true, offlineMode: false, apiOnline: true },
      storeId: 5,
    })
  ) {
    throw new Error('expected local checkout when forceOfflineMode');
  }
});

test('catalogMatchesStore: null storeId → false', () => {
  if (catalogMatchesStore(5, null) || catalogMatchesStore(null, 5)) {
    throw new Error('null storeId must not match');
  }
});

test('hasLocalPosCatalog: productCount без storeId → false', () => {
  if (hasLocalPosCatalog({ productCount: 10, storeId: null }, 5)) {
    throw new Error('catalog without storeId must not count');
  }
});

test('несовпадение storeId каталога', () => {
  if (!isCatalogStoreMismatch(5, 9)) {
    throw new Error('expected store mismatch');
  }
  if (isCatalogStoreMismatch(5, 5)) {
    throw new Error('same store must not mismatch');
  }
});

console.log(`\nИтого: ${passed} ok, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);

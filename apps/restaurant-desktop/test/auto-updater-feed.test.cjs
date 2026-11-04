const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveFeedUrl } = require('../electron/autoUpdaterFeed.cjs');

test('restaurant updater feed is r-aurent restaurant-desktop, not cashier /desktop/', () => {
  const url = resolveFeedUrl({});
  assert.match(url, /restaurant-desktop\/$/);
  assert.doesNotMatch(url, /\/downloads\/desktop\/$/);
});

test('AURENT_RESTAURANT_UPDATE_URL overrides feed', () => {
  const url = resolveFeedUrl({ AURENT_RESTAURANT_UPDATE_URL: 'https://example.test/upd' });
  assert.equal(url, 'https://example.test/upd/');
});

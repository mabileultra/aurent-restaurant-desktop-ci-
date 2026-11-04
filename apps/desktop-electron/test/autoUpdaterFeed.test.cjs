const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveFeedUrl } = require('../electron/autoUpdaterFeed.cjs');

test('update feed stays on aurent.uz even if UI is r-aurent', () => {
  assert.equal(resolveFeedUrl('https://r-aurent.uz', {}), 'https://aurent.uz/downloads/desktop/');
  assert.equal(
    resolveFeedUrl('https://r-aurent.uz/cashier/login', {}),
    'https://aurent.uz/downloads/desktop/',
  );
  assert.equal(resolveFeedUrl('http://127.0.0.1:5174', {}), 'https://aurent.uz/downloads/desktop/');
});

test('AURENT_UPDATE_URL overrides feed', () => {
  assert.equal(
    resolveFeedUrl('https://r-aurent.uz', { AURENT_UPDATE_URL: 'https://cdn.example/desktop' }),
    'https://cdn.example/desktop/',
  );
});

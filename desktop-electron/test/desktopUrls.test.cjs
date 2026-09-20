const test = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveDesktopUrls,
  PRODUCTION_RESTAURANT_ORIGIN,
  DEV_RESTAURANT_URL,
} = require('../config/desktopUrls');

test('resolveDesktopUrls includes restaurant SPA origin', () => {
  const prev = process.env.AURENT_RESTAURANT_WEB_URL;
  delete process.env.AURENT_RESTAURANT_WEB_URL;
  try {
    assert.equal(resolveDesktopUrls({ isPackaged: true }).restaurantUrl, PRODUCTION_RESTAURANT_ORIGIN);
    assert.equal(resolveDesktopUrls({ isPackaged: false }).restaurantUrl, DEV_RESTAURANT_URL);
  } finally {
    if (prev == null) delete process.env.AURENT_RESTAURANT_WEB_URL;
    else process.env.AURENT_RESTAURANT_WEB_URL = prev;
  }
});

test('AURENT_RESTAURANT_WEB_URL overrides default', () => {
  const prev = process.env.AURENT_RESTAURANT_WEB_URL;
  process.env.AURENT_RESTAURANT_WEB_URL = 'https://custom-r.example';
  try {
    assert.equal(resolveDesktopUrls({ isPackaged: true }).restaurantUrl, 'https://custom-r.example');
  } finally {
    if (prev == null) delete process.env.AURENT_RESTAURANT_WEB_URL;
    else process.env.AURENT_RESTAURANT_WEB_URL = prev;
  }
});

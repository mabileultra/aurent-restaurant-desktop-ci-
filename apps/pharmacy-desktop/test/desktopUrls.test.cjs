const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveDesktopUrls, PRODUCTION_ORIGIN } = require('../config/desktopUrls');

describe('pharmacy desktopUrls', () => {
  it('packaged defaults to p-aurent login', () => {
    const prev = process.env.AURENT_WEB_URL;
    delete process.env.AURENT_WEB_URL;
    delete process.env.VITE_DEV_URL;
    const urls = resolveDesktopUrls({ isPackaged: true });
    assert.equal(PRODUCTION_ORIGIN, 'https://p-aurent.uz');
    assert.equal(urls.webUrl, 'https://p-aurent.uz/login');
    if (prev != null) process.env.AURENT_WEB_URL = prev;
  });
});

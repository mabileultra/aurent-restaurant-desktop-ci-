const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveFeedUrl } = require('../electron/autoUpdaterFeed.cjs');

describe('pharmacy autoUpdaterFeed', () => {
  it('uses pharmacy-desktop downloads path', () => {
    assert.equal(
      resolveFeedUrl('https://p-aurent.uz/login', {}),
      'https://aurent.uz/downloads/pharmacy-desktop/',
    );
  });
});

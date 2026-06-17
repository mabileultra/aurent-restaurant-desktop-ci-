#!/usr/bin/env node
const assert = require('assert');
const { buildUpdateFeedUrl } = require('../electron/updates/update-feed-url.cjs');

const cases = [
  {
    config: { backendOrigin: 'https://www.aurent.uz', cashierUrl: 'http://127.0.0.1:5199' },
    expected: 'https://www.aurent.uz/downloads/desktop/',
  },
  {
    config: { backendOrigin: 'http://111.88.132.126:8081', cashierUrl: 'http://127.0.0.1:5199' },
    expected: 'http://111.88.132.126:8081/downloads/desktop/',
  },
  {
    config: { cashierUrl: 'https://www.aurent.uz/cashier/login' },
    expected: 'https://www.aurent.uz/downloads/desktop/',
  },
  {
    config: { updateFeedUrl: 'https://cdn.example.com/desktop/' },
    expected: 'https://cdn.example.com/desktop/',
  },
  {
    config: { backendOrigin: 'http://127.0.0.1:5199' },
    expected: null,
  },
];

for (const { config, expected } of cases) {
  assert.strictEqual(buildUpdateFeedUrl(config), expected, JSON.stringify(config));
}

console.log('verify-update-feed-url: OK');

const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldRedirectToCashierLogin } = require('../electron/navigation/desktopNavigationGuard');

const cfg = {
  cashierUrl: 'https://aurent.uz',
  restaurantUrl: 'https://r-aurent.uz',
};

test('bounces main-origin marketing paths to PIN login', () => {
  assert.equal(shouldRedirectToCashierLogin('https://aurent.uz/', cfg), true);
  assert.equal(shouldRedirectToCashierLogin('https://aurent.uz/about', cfg), true);
});

test('does not bounce restaurant SPA or cashier routes', () => {
  assert.equal(shouldRedirectToCashierLogin('https://r-aurent.uz/', cfg), false);
  assert.equal(shouldRedirectToCashierLogin('https://r-aurent.uz/rst/pos', cfg), false);
  assert.equal(shouldRedirectToCashierLogin('https://aurent.uz/cashier/login', cfg), false);
  assert.equal(shouldRedirectToCashierLogin('https://aurent.uz/rst/pos', cfg), false);
});

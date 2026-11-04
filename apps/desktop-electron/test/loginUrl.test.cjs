const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildLoginUrl,
  normalizeCompanyLoginCode,
  normalizeAppWorld,
  APP_WORLD_RESTAURANT,
} = require('../electron/config/loginUrl');

test('buildLoginUrl appends company code', () => {
  assert.equal(normalizeCompanyLoginCode('10001'), '10001');
  assert.equal(
    buildLoginUrl({ cashierUrl: 'https://aurent.uz', companyLoginCode: '10001' }),
    'https://aurent.uz/cashier/login?companyLoginCode=10001',
  );
});

test('restaurant world uses restaurantUrl, not cashierUrl', () => {
  assert.equal(normalizeAppWorld('rst'), APP_WORLD_RESTAURANT);
  assert.equal(
    buildLoginUrl({
      appWorld: 'restaurant',
      cashierUrl: 'https://aurent.uz',
      restaurantUrl: 'https://r-aurent.uz',
      companyLoginCode: '10001',
    }),
    'https://r-aurent.uz/cashier/login?companyLoginCode=10001',
  );
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildLoginUrl, normalizeCompanyLoginCode } = require('../electron/config/loginUrl');

test('buildLoginUrl appends company code', () => {
  assert.equal(normalizeCompanyLoginCode('10001'), '10001');
  assert.equal(
    buildLoginUrl({ cashierUrl: 'https://aurent.uz', companyLoginCode: '10001' }),
    'https://aurent.uz/cashier/login?companyLoginCode=10001',
  );
});

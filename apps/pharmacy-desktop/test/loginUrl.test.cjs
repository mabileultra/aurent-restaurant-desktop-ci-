const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildLoginUrl,
  normalizeAppWorld,
  APP_WORLD_PHARMACY,
} = require('../electron/config/loginUrl');

describe('pharmacy loginUrl', () => {
  it('always pharmacy world', () => {
    assert.equal(normalizeAppWorld('main'), APP_WORLD_PHARMACY);
    assert.equal(normalizeAppWorld('rst'), APP_WORLD_PHARMACY);
  });

  it('builds /login on pharmacy origin', () => {
    assert.equal(
      buildLoginUrl({ cashierUrl: 'https://p-aurent.uz', companyLoginCode: '10001' }),
      'https://p-aurent.uz/login?companyLoginCode=10001',
    );
  });
});

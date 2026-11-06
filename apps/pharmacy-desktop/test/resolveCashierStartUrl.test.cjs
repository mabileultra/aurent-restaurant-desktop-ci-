const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveCashierStartUrl } = require('../electron/ui/resolveCashierStartUrl');
const { UI_MODE_REMOTE } = require('../electron/config/uiMode');

describe('pharmacy resolveCashierStartUrl', () => {
  it('remote login on p-aurent', async () => {
    const result = await resolveCashierStartUrl({
      cfg: {
        cashierUrl: 'https://p-aurent.uz',
        companyLoginCode: '10001',
        uiMode: UI_MODE_REMOTE,
        backendOrigin: 'https://p-aurent.uz',
      },
      stopServer: async () => {},
    });
    assert.equal(result.source, 'remote');
    assert.equal(result.url, 'https://p-aurent.uz/login?companyLoginCode=10001');
  });
});

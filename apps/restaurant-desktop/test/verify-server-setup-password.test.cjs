const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const path = require('path');
const os = require('os');
const fs = require('fs');

describe('resolveVerifyUrls', () => {
  it('builds public cashier verify path from cloud api url', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rst-verify-'));
    const electronStub = { app: { getPath: () => tmp } };
    const cloudAbs = require.resolve('../electron/runtime/cloudApiUrlStore.js');
    const verifyAbs = require.resolve('../electron/setup/verifyServerSetupPassword.js');
    const original = Module._load;
    Module._load = function load(request, parent, isMain) {
      if (request === 'electron') return electronStub;
      return original(request, parent, isMain);
    };
    try {
      delete require.cache[cloudAbs];
      delete require.cache[verifyAbs];
      const cloud = require(cloudAbs);
      cloud.setCloudApiUrl('https://r-aurent.uz/api/v1/');
      const { resolveVerifyUrls } = require(verifyAbs);
      assert.deepEqual(resolveVerifyUrls(), [
        'https://r-aurent.uz/api/v1/public/cashier/server-setup/verify-password',
      ]);
    } finally {
      Module._load = original;
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

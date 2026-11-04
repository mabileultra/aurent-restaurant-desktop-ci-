const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const path = require('path');
const os = require('os');
const fs = require('fs');

describe('cloudApiUrlStore normalize via set/get', () => {
  it('persists https cloud api url', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rst-cloud-'));
    const electronStub = {
      app: { getPath: () => tmp },
    };
    const abs = require.resolve('../electron/runtime/cloudApiUrlStore.js');
    const original = Module._load;
    Module._load = function load(request, parent, isMain) {
      if (request === 'electron') return electronStub;
      return original(request, parent, isMain);
    };
    try {
      delete require.cache[abs];
      const store = require(abs);
      const saved = store.setCloudApiUrl('https://r-aurent.uz/api/v1/');
      assert.equal(saved, 'https://r-aurent.uz/api/v1');
      assert.equal(store.getCloudApiUrl(), 'https://r-aurent.uz/api/v1');
    } finally {
      Module._load = original;
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

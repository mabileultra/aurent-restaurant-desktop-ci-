const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { isNetworkLoadError } = require('../electron/ui/networkLoadErrors');

describe('isNetworkLoadError', () => {
  it('detects ERR_INTERNET_DISCONNECTED', () => {
    assert.equal(isNetworkLoadError(-106), true);
  });

  it('ignores HTTP and cert errors', () => {
    assert.equal(isNetworkLoadError(-200), false);
    assert.equal(isNetworkLoadError(0), false);
  });
});

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { cloudOriginsAhead } = require('../electron/runtime/edgeCloudOriginProbe');

describe('cloudOriginsAhead', () => {
  it('false when empty', () => {
    assert.equal(cloudOriginsAhead(new Map(), new Map()), false);
  });

  it('true when cloud origin never seen', () => {
    assert.equal(cloudOriginsAhead(new Map([[1, 5]]), new Map()), true);
  });

  it('true when cloud grew past seen', () => {
    assert.equal(cloudOriginsAhead(new Map([[1, 8]]), new Map([[1, 5]])), true);
  });

  it('false when cloud same as seen', () => {
    assert.equal(cloudOriginsAhead(new Map([[1, 5]]), new Map([[1, 5]])), false);
  });

  it('ignores origin 0', () => {
    assert.equal(cloudOriginsAhead(new Map([[1, 0]]), new Map()), false);
  });
});

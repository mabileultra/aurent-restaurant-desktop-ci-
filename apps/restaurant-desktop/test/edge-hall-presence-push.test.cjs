const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { PRESENCE_MIN_MS } = require('../electron/runtime/edgeHallPresencePush');

describe('edgeHallPresencePush', () => {
  it('exports throttle window for online heartbeats', () => {
    assert.equal(PRESENCE_MIN_MS, 15_000);
  });
});

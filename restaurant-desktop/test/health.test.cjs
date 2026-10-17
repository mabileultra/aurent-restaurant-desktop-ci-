const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { probeHealth } = require('../electron/runtime/health');

describe('health probe', () => {
  it('returns ok:false for closed port', async () => {
    const hit = await probeHealth('http://127.0.0.1:59999/api/v1/actuator/health', 500);
    assert.equal(hit.ok, false);
  });
});

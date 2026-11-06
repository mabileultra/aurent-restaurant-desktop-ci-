const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Pure resolve without Electron app — inline copy of env rules.
function resolveLanHubEnabled({ isPackaged = false, env = {} } = {}) {
  const fromEnv = env.RESTAURANT_LAN_HUB;
  if (fromEnv === '0' || fromEnv === 'false') return false;
  if (fromEnv === '1' || fromEnv === 'true') return true;
  return Boolean(isPackaged);
}

describe('lan hub resolve', () => {
  it('packaged defaults on', () => {
    assert.equal(resolveLanHubEnabled({ isPackaged: true, env: {} }), true);
  });
  it('dev unpackaged defaults off', () => {
    assert.equal(resolveLanHubEnabled({ isPackaged: false, env: {} }), false);
  });
  it('env 0 wins over packaged', () => {
    assert.equal(resolveLanHubEnabled({ isPackaged: true, env: { RESTAURANT_LAN_HUB: '0' } }), false);
  });
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveRestaurantLocalFirst } = require('../electron/config/restaurantLocalFirst');

test('restaurantLocalFirst defaults false (dark)', () => {
  assert.equal(resolveRestaurantLocalFirst({ userConfig: {}, env: {} }), false);
  assert.equal(resolveRestaurantLocalFirst({ userConfig: null, env: {} }), false);
});

test('restaurantLocalFirst from user config', () => {
  assert.equal(
    resolveRestaurantLocalFirst({ userConfig: { restaurantLocalFirst: true }, env: {} }),
    true,
  );
});

test('env overrides user config', () => {
  assert.equal(
    resolveRestaurantLocalFirst({
      userConfig: { restaurantLocalFirst: true },
      env: { AURENT_RESTAURANT_LOCAL_FIRST: '0' },
    }),
    false,
  );
  assert.equal(
    resolveRestaurantLocalFirst({
      userConfig: { restaurantLocalFirst: false },
      env: { AURENT_RESTAURANT_LOCAL_FIRST: '1' },
    }),
    true,
  );
});

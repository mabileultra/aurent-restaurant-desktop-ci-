const test = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveRestaurantLocalFirst,
  isRestaurantLocalFirstKillSwitchOn,
} = require('../electron/config/restaurantLocalFirst');

test('kill switch is on — config true is ignored', () => {
  assert.equal(isRestaurantLocalFirstKillSwitchOn(), true);
  assert.equal(
    resolveRestaurantLocalFirst({ userConfig: { restaurantLocalFirst: true }, env: {} }),
    false,
  );
  assert.equal(resolveRestaurantLocalFirst({ userConfig: {}, env: {} }), false);
});

test('kill switch still allows explicit env lab opt-in', () => {
  assert.equal(
    resolveRestaurantLocalFirst({
      userConfig: { restaurantLocalFirst: false },
      env: { AURENT_RESTAURANT_LOCAL_FIRST: '1' },
    }),
    true,
  );
});

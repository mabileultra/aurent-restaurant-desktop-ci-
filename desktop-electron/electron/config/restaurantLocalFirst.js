/**
 * Dark flag for restaurant local-first POS.
 * Default false — existing restaurant cashiers stay on remote r-aurent UI.
 *
 * KILL SWITCH: while true, local-first stays OFF for all clients (ignore config.json).
 * Lab-only re-enable: AURENT_RESTAURANT_LOCAL_FIRST=1
 * Flip to false when the offline stack is ready for production again.
 */
const RESTAURANT_LOCAL_FIRST_DISABLED = true;

function resolveRestaurantLocalFirst({ userConfig, env = process.env } = {}) {
  const fromEnv = String(env?.AURENT_RESTAURANT_LOCAL_FIRST || '').trim().toLowerCase();
  if (RESTAURANT_LOCAL_FIRST_DISABLED) {
    return fromEnv === '1' || fromEnv === 'true' || fromEnv === 'yes';
  }
  if (fromEnv === '1' || fromEnv === 'true' || fromEnv === 'yes') return true;
  if (fromEnv === '0' || fromEnv === 'false' || fromEnv === 'no') return false;
  return userConfig?.restaurantLocalFirst === true;
}

function isRestaurantLocalFirstKillSwitchOn() {
  return RESTAURANT_LOCAL_FIRST_DISABLED === true;
}

module.exports = {
  resolveRestaurantLocalFirst,
  isRestaurantLocalFirstKillSwitchOn,
  RESTAURANT_LOCAL_FIRST_DISABLED,
};

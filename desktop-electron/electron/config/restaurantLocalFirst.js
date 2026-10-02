/**
 * Dark flag for restaurant local-first POS.
 * Default false — existing restaurant cashiers stay on remote r-aurent UI.
 */
function resolveRestaurantLocalFirst({ userConfig, env = process.env } = {}) {
  const fromEnv = String(env?.AURENT_RESTAURANT_LOCAL_FIRST || '').trim().toLowerCase();
  if (fromEnv === '1' || fromEnv === 'true' || fromEnv === 'yes') return true;
  if (fromEnv === '0' || fromEnv === 'false' || fromEnv === 'no') return false;
  return userConfig?.restaurantLocalFirst === true;
}

module.exports = { resolveRestaurantLocalFirst };

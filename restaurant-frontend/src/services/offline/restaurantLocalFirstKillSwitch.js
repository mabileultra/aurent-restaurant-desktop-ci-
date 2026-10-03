/**
 * Temporary production kill switch for restaurant offline / local-first.
 * When true: cashier + waiter use classic online API only (no SQLite/IDB/hub path).
 * Set to false when the local-first stack is ready for clients again.
 */
export const RESTAURANT_LOCAL_FIRST_KILLED = true;

export function isRestaurantLocalFirstKilled() {
  return RESTAURANT_LOCAL_FIRST_KILLED === true;
}

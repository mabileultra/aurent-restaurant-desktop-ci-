/** Tuned for ~2k concurrent POS on one API: less chatter, still snappy enough. */
export const COUNTER_STALE_MS = 20_000;
export const FLOOR_STALE_MS = 10_000;
export const SHIFT_STALE_MS = 30_000;
export const MENU_STALE_MS = 15 * 60_000;
export const ORDER_STALE_MS = 4_000;
/** Fallback if revision poll misses; primary sync is useStoreFloorSync (~2s watermark). */
export const ORDER_POLL_MS = 18_000;

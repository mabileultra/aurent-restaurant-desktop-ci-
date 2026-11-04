/** Kick desktop print relay without waiting for the next poll tick. */
const EVENT = 'rst-print-flush';

export function flushRestaurantPrintRelay() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** Immediate flush without waiting for React effect listeners (same tick). */
export function flushRestaurantPrintRelaySoon() {
  flushRestaurantPrintRelay();
}

export function onRestaurantPrintFlush(handler) {
  if (typeof window === 'undefined') return () => {};
  const run = () => {
    try {
      handler();
    } catch {
      /* ignore */
    }
  };
  window.addEventListener(EVENT, run);
  return () => window.removeEventListener(EVENT, run);
}

const recentGuestBills = new Map();

/** Avoid double-print when FE prints bill immediately and poll later acks the same job. */
export function markGuestBillPrintedLocally(orderId) {
  if (orderId == null) return;
  recentGuestBills.set(String(orderId), Date.now());
  if (recentGuestBills.size > 40) {
    const oldest = [...recentGuestBills.entries()].sort((a, b) => a[1] - b[1])[0];
    if (oldest) recentGuestBills.delete(oldest[0]);
  }
}

/** Clear before intentional reprint so poll can print if local print failed. */
export function clearGuestBillPrintedLocally(orderId) {
  if (orderId == null) return;
  recentGuestBills.delete(String(orderId));
}

export function wasGuestBillPrintedLocally(orderId, withinMs = 8_000) {
  if (orderId == null) return false;
  const at = recentGuestBills.get(String(orderId));
  return at != null && Date.now() - at < withinMs;
}

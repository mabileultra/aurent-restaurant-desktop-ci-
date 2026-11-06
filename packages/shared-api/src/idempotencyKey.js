/**
 * Idempotency key for financial / critical POS requests.
 * Prevents duplicate server execution of the same POST/PUT/PATCH.
 */
export function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const IDEMPOTENCY_HEADER = 'X-Idempotency-Key';

/** Detect financial / critical mutating endpoints that need an idempotency key. */
export function isFinancialOrCriticalEndpoint(url = '', method = 'POST') {
  const upperMethod = String(method).toUpperCase();
  if (upperMethod !== 'POST' && upperMethod !== 'PUT' && upperMethod !== 'PATCH') {
    return false;
  }
  const cleanUrl = String(url).toLowerCase();
  return (
    cleanUrl.includes('/sales')
    || cleanUrl.includes('/returns')
    || cleanUrl.includes('/shifts')
    || cleanUrl.includes('/cash-movements')
    || cleanUrl.includes('/cash-in')
    || cleanUrl.includes('/cash-out')
    || cleanUrl.includes('/billing')
    || cleanUrl.includes('/top-up')
    || cleanUrl.includes('/pay')
  );
}

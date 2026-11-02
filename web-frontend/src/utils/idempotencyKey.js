/**
 * Tranzaksiyalar va moliyaviy so'rovlar uchun takrorlanmas Idempotency Key generatori (P0)
 * Serverga bir xil so'rov ikki marta bajarilishining oldini oladi
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

/**
 * Idempotency header nomi
 */
export const IDEMPOTENCY_HEADER = 'X-Idempotency-Key';

/**
 * Berilgan URL moliyaviy yoki xavfli amal ekanligini aniqlash
 */
export function isFinancialOrCriticalEndpoint(url = '', method = 'POST') {
  const upperMethod = String(method).toUpperCase();
  if (upperMethod !== 'POST' && upperMethod !== 'PUT' && upperMethod !== 'PATCH') {
    return false;
  }
  const cleanUrl = String(url).toLowerCase();
  return (
    cleanUrl.includes('/sales') ||
    cleanUrl.includes('/returns') ||
    cleanUrl.includes('/shifts') ||
    cleanUrl.includes('/cash-movements') ||
    cleanUrl.includes('/cash-in') ||
    cleanUrl.includes('/cash-out') ||
    cleanUrl.includes('/billing') ||
    cleanUrl.includes('/top-up') ||
    cleanUrl.includes('/pay')
  );
}

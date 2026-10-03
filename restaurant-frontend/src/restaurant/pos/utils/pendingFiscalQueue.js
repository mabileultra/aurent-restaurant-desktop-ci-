/** Queue pending Multikassa fiscals for retry when back online. */

import { FISCAL_STATUS } from '../../../services/multikassa/multikassaConstants';
import { retryPendingFiscalOnPayload } from '../../../services/multikassa/retryPendingFiscalOnPayload';
const LS_KEY = 'rst-pending-fiscals';

function readQueue() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(rows) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(rows.slice(-40)));
  } catch {
    /* ignore */
  }
}

export function enqueuePendingFiscal({ storeId, cashRegisterId, orderId, fiscal }) {
  if (!fiscal || fiscal.fiscalStatus !== FISCAL_STATUS.PENDING) return;
  if (!fiscal.multikassaRetryBody) return;
  const rows = readQueue().filter((r) => r.orderId !== orderId);
  rows.push({
    storeId,
    cashRegisterId: cashRegisterId || null,
    orderId: orderId != null ? String(orderId) : null,
    fiscal,
    at: new Date().toISOString(),
  });
  writeQueue(rows);
}

export async function flushPendingFiscals() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, reason: 'offline' };
  }
  const rows = readQueue();
  if (!rows.length) return { ok: true, left: 0 };
  const left = [];
  for (const row of rows) {
    const next = await retryPendingFiscalOnPayload(
      { fiscal: row.fiscal, storeId: row.storeId },
      { storeId: row.storeId, cashRegisterId: row.cashRegisterId },
    );
    if (next?.fiscal?.fiscalStatus === FISCAL_STATUS.PENDING) {
      left.push({ ...row, fiscal: next.fiscal });
    }
  }
  writeQueue(left);
  return { ok: true, left: left.length, done: rows.length - left.length };
}

export function startPendingFiscalFlushLoop() {
  if (typeof window === 'undefined') return () => {};
  const tick = () => {
    void flushPendingFiscals().catch(() => null);
  };
  window.addEventListener('online', tick);
  const id = window.setInterval(tick, 60_000);
  tick();
  return () => {
    window.removeEventListener('online', tick);
    window.clearInterval(id);
  };
}

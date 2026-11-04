/** Queue pending Multikassa fiscals for retry when back online. */

import { FISCAL_STATUS, resolvePendingFiscalProvider } from '../../../services/fiscal';
import { isRestaurantDesktop } from '../../../utils/restaurantDesktop';

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
  notifyPendingFiscalListeners();
}

export function getPendingFiscalCount() {
  return readQueue().length;
}

export function listPendingFiscals() {
  return readQueue();
}

const listeners = new Set();

export function subscribePendingFiscals(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notifyPendingFiscalListeners() {
  const count = getPendingFiscalCount();
  listeners.forEach((cb) => {
    try {
      cb(count);
    } catch {
      /* ignore */
    }
  });
}

/**
 * Send pending OFD/fiscals. On restaurant-desktop this must only run after
 * explicit user confirm («Отправить в ОФД?»), never from the silent loop.
 */
export async function flushPendingFiscals() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, reason: 'offline' };
  }
  const rows = readQueue();
  if (!rows.length) return { ok: true, left: 0, done: 0 };
  const left = [];
  for (const row of rows) {
    const payload = { fiscal: row.fiscal, storeId: row.storeId };
    const next = await resolvePendingFiscalProvider(payload).retryPending(payload, {
      storeId: row.storeId,
      cashRegisterId: row.cashRegisterId,
    });
    if (next?.fiscal?.fiscalStatus === FISCAL_STATUS.PENDING) {
      left.push({ ...row, fiscal: next.fiscal });
    }
  }
  writeQueue(left);
  notifyPendingFiscalListeners();
  return { ok: true, left: left.length, done: rows.length - left.length };
}

export function startPendingFiscalFlushLoop() {
  if (typeof window === 'undefined') return () => {};
  // Restaurant desktop: never auto-send OFD queue — UI asks for confirm.
  if (isRestaurantDesktop()) {
    notifyPendingFiscalListeners();
    return () => {};
  }
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

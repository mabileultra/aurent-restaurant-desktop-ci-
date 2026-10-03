/**
 * Pull cashier/monoblock hub orders into waiter IndexedDB so both sides
 * share the same ticket (punch on phone ↔ punch on касса).
 */

import { idbGet, idbPut } from './idb';
import { fetchHubSnapshot, getConfiguredHubUrl, setConfiguredHubUrl } from './outboxSync';
import { discoverLanHubs } from '../discoverLanHubs';

function parseIso(v) {
  const t = Date.parse(String(v || ''));
  return Number.isFinite(t) ? t : 0;
}

function mapHubItem(it) {
  const qty = Number(it?.quantity) || 0;
  const storedSent = Number(it?.sentQuantity ?? it?.sent_quantity);
  const sent = Number.isFinite(storedSent) && storedSent >= 0
    ? Math.min(storedSent, qty)
    : (it?.status === 'SENT' || it?.itemStatus === 'SENT_TO_KITCHEN' ? qty : 0);
  const status = it?.status === 'CANCELLED' || it?.itemStatus === 'CANCELLED'
    ? 'CANCELLED'
    : (sent > 0 || it?.status === 'SENT' ? 'SENT' : 'OPEN');
  return {
    id: String(it.id),
    menuItemId: it.menuItemId != null ? String(it.menuItemId) : null,
    name: String(it.name || ''),
    quantity: qty,
    unitPrice: Number(it.unitPrice) || 0,
    note: it.note || null,
    modifiers: Array.isArray(it.modifiers) ? it.modifiers : [],
    status,
    sentQuantity: sent,
    portionText: it.portionText || null,
    stationId: it.stationId,
    categoryId: it.categoryId,
  };
}

/** Hub snapshot order → IDB row shape used by waiter commands. */
export function hubOrderToIdbRow(order, storeId) {
  if (!order?.id) return null;
  const items = (Array.isArray(order.items) ? order.items : [])
    .filter((it) => it?.id != null)
    .map(mapHubItem);
  const statusRaw = String(order.status || 'OPEN').toUpperCase();
  const status = statusRaw === 'OPEN' || statusRaw === 'ACTIVE' || statusRaw === 'BILLING'
    ? (statusRaw === 'OPEN' && items.some((i) => i.status !== 'CANCELLED') ? 'ACTIVE' : statusRaw)
    : statusRaw;
  return {
    id: String(order.id),
    serverId: order.serverId || null,
    storeId: order.storeId != null ? Number(order.storeId) : storeId,
    tableId: order.tableId != null ? String(order.tableId) : null,
    tableLabel: order.payload?.tableCode || order.tableLabel || null,
    status: status === 'OPEN' && items.length ? 'ACTIVE' : status,
    guestCount: Math.max(1, Number(order.guestCount) || 1),
    waiterId: order.waiterId || null,
    channel: order.payload?.channel || order.channel || 'DINE_IN',
    openedAt: order.openedAt || new Date().toISOString(),
    updatedAt: order.updatedAt || new Date().toISOString(),
    items,
    mirrored: true,
  };
}

/**
 * Upsert hub orders into IDB. Newer local (by updatedAt) wins.
 * @returns {Promise<number>} imported/updated count
 */
export async function upsertHubOrdersIntoIdb(orders, storeId) {
  let n = 0;
  for (const raw of Array.isArray(orders) ? orders : []) {
    const row = hubOrderToIdbRow(raw, storeId);
    if (!row) continue;
    const existing = await idbGet('orders', row.id);
    if (existing && parseIso(existing.updatedAt) > parseIso(row.updatedAt)) continue;
    await idbPut('orders', existing ? { ...existing, ...row, items: row.items } : row);
    n += 1;
  }
  return n;
}

/** Ensure LAN hub URL is set (discover once when missing). */
export async function ensureWaiterHubUrl() {
  const current = getConfiguredHubUrl();
  if (current) {
    try {
      const res = await fetch(`${current}/hub/health`);
      if (res.ok) return current;
    } catch {
      /* rediscover */
    }
  }
  const hits = await discoverLanHubs({ preferUrl: current || undefined, timeoutMs: 280 });
  const best = hits[0];
  if (!best?.url) return current || '';
  setConfiguredHubUrl(best.url);
  return best.url;
}

/**
 * Pull hub snapshot open orders into waiter IDB.
 * @returns {Promise<{ ok: boolean, imported: number, hubUrl: string }>}
 */
export async function pullHubOrdersForWaiter({ storeId } = {}) {
  const hubUrl = await ensureWaiterHubUrl();
  if (!hubUrl) return { ok: false, imported: 0, hubUrl: '' };
  const snap = await fetchHubSnapshot(hubUrl);
  if (!snap) return { ok: false, imported: 0, hubUrl };
  const sid = storeId != null ? Number(storeId) : Number(snap.storeId);
  const imported = await upsertHubOrdersIntoIdb(snap.orders || [], sid);
  return { ok: true, imported, hubUrl, snapshot: snap };
}

/** Load one order from hub into IDB (open ticket that only exists on касса). */
export async function importHubOrderById(orderId, storeId) {
  const id = String(orderId || '').trim();
  if (!id) return null;
  const { snapshot } = await pullHubOrdersForWaiter({ storeId });
  const raw = (snapshot?.orders || []).find((o) => String(o.id) === id);
  if (!raw) return null;
  await upsertHubOrdersIntoIdb([raw], storeId);
  const row = await idbGet('orders', id);
  return row;
}

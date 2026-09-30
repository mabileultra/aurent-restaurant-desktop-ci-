/** Resolve waiter display name for thermal slips (kitchen / bill / category). */

import { userApi } from '../../../api/user.api';
import { displayUserName } from './floorPosDerivations';

let rosterCache = { storeId: null, at: 0, map: new Map() };

function fromMap(waiterNameById, waiterUserId) {
  if (waiterUserId == null || !waiterNameById) return null;
  const id = String(waiterUserId);
  return waiterNameById.get?.(id) || waiterNameById[id] || null;
}

function seedFromHintMap(storeId, waiterNameById) {
  if (storeId == null || !waiterNameById) return;
  const entries = waiterNameById instanceof Map
    ? [...waiterNameById.entries()]
    : Object.entries(waiterNameById);
  if (!entries.length) return;
  const map = new Map(rosterCache.storeId === storeId ? rosterCache.map : []);
  for (const [id, name] of entries) {
    if (id != null && name) map.set(String(id), name);
  }
  if (map.size) {
    rosterCache = { storeId, at: Date.now(), map };
  }
}

async function loadRosterMap(storeId) {
  if (storeId == null) return new Map();
  const now = Date.now();
  if (
    rosterCache.storeId === storeId
    && rosterCache.map.size > 0
    && now - rosterCache.at < 60_000
  ) {
    return rosterCache.map;
  }
  try {
    const res = await userApi.getPosRoster(storeId);
    const map = new Map();
    for (const row of res.data ?? []) {
      map.set(String(row.id), displayUserName(row));
    }
    rosterCache = { storeId, at: now, map };
    return map;
  } catch {
    return rosterCache.storeId === storeId ? rosterCache.map : new Map();
  }
}

/** Warm cache when print relay starts — first slip does not wait on roster. */
export function prefetchPrintWaiterRoster(storeId, waiterNameById) {
  if (storeId == null) return Promise.resolve();
  seedFromHintMap(storeId, waiterNameById);
  return loadRosterMap(storeId).then(() => undefined);
}

/** Merge POS-page staff map into cache without a network round-trip. */
export function seedPrintWaiterRoster(storeId, waiterNameById) {
  seedFromHintMap(storeId, waiterNameById);
}

/**
 * Prefer in-memory map from the POS page; if missing (client kitchen PC race /
 * empty roster), fetch /users/pos-roster once and cache.
 */
export async function resolvePrintWaiterName(storeId, waiterUserId, waiterNameById) {
  const hit = fromMap(waiterNameById, waiterUserId);
  if (hit) return hit;
  if (waiterUserId == null || storeId == null) return null;
  seedFromHintMap(storeId, waiterNameById);
  const cached = rosterCache.storeId === storeId
    ? rosterCache.map.get(String(waiterUserId))
    : null;
  if (cached) return cached;
  const map = await loadRosterMap(storeId);
  return map.get(String(waiterUserId)) || null;
}

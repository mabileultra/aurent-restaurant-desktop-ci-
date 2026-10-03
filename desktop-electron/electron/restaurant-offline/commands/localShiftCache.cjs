/**
 * Cache / read current shift snapshot for offline-lite POS.
 */
function saveLocalShift(db, storeId, shift) {
  const sid = Number(storeId);
  if (!Number.isFinite(sid)) throw new Error('store_id_required');
  const at = new Date().toISOString();
  const key = `shift:current:${sid}`;
  const value = shift == null ? '' : JSON.stringify(shift);
  db.prepare(
    `INSERT INTO sync_state(key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, value, at);
  return { ok: true, storeId: sid };
}

function getLocalShift(db, storeId) {
  const sid = Number(storeId);
  if (!Number.isFinite(sid)) return null;
  const row = db.prepare(`SELECT value FROM sync_state WHERE key = ?`).get(`shift:current:${sid}`);
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

module.exports = { saveLocalShift, getLocalShift };

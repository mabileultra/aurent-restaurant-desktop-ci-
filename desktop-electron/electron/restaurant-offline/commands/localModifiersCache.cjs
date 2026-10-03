/** Cache menu-item modifiers in sync_state for offline POS. */

function modifiersKey(menuItemId) {
  return `modifiers:item:${String(menuItemId)}`;
}

function saveLocalModifiers(db, menuItemId, groups) {
  if (menuItemId == null) throw new Error('menu_item_id_required');
  const at = new Date().toISOString();
  db.prepare(
    `INSERT INTO sync_state(key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(modifiersKey(menuItemId), JSON.stringify(groups ?? []), at);
  return { ok: true };
}

function getLocalModifiers(db, menuItemId) {
  if (menuItemId == null) return [];
  const row = db.prepare(`SELECT value FROM sync_state WHERE key = ?`).get(modifiersKey(menuItemId));
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

module.exports = { saveLocalModifiers, getLocalModifiers };

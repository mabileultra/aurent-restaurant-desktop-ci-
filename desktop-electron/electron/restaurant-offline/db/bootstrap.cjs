/**
 * Minimal B3: import menu categories / items / tables into local SQLite.
 */
function importRestaurantBootstrap(db, payload = {}) {
  const storeId = Number(payload.storeId);
  if (!Number.isFinite(storeId)) throw new Error('store_id_required');
  const now = String(payload.syncedAt || new Date().toISOString());

  const categories = Array.isArray(payload.categories) ? payload.categories : [];
  const items = Array.isArray(payload.menuItems || payload.items) ? (payload.menuItems || payload.items) : [];
  const tables = Array.isArray(payload.tables) ? payload.tables : [];

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`DELETE FROM menu_items WHERE store_id = ?`).run(storeId);
    db.prepare(`DELETE FROM menu_categories WHERE store_id = ?`).run(storeId);
    db.prepare(`DELETE FROM floor_tables WHERE store_id = ?`).run(storeId);

    const insCat = db.prepare(
      `INSERT INTO menu_categories(
         id, server_id, store_id, name, sort_order, auto_print, print_printer_name, active, payload_json, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const row of categories) {
      const id = String(row.id ?? row.serverId ?? '');
      if (!id) continue;
      insCat.run(
        id,
        row.serverId ?? row.id ?? null,
        storeId,
        String(row.name || ''),
        Number(row.sortOrder) || 100,
        row.autoPrint ? 1 : 0,
        row.printPrinterName || null,
        row.active === false ? 0 : 1,
        JSON.stringify(row),
        now,
      );
    }

    const insItem = db.prepare(
      `INSERT INTO menu_items(
         id, server_id, store_id, category_id, name, price, active, payload_json, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const row of items) {
      const id = String(row.id ?? row.serverId ?? '');
      if (!id) continue;
      insItem.run(
        id,
        row.serverId ?? row.id ?? null,
        storeId,
        row.categoryId != null ? String(row.categoryId) : null,
        String(row.name || ''),
        Number(row.price ?? row.sellingPrice) || 0,
        row.active === false ? 0 : 1,
        JSON.stringify(row),
        now,
      );
    }

    const insTable = db.prepare(
      `INSERT INTO floor_tables(
         id, server_id, store_id, name, zone_name, sort_order, active, payload_json, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const row of tables) {
      const id = String(row.id ?? row.serverId ?? '');
      if (!id) continue;
      insTable.run(
        id,
        row.serverId ?? row.id ?? null,
        storeId,
        String(row.name || row.label || ''),
        row.zoneName || row.zone || null,
        Number(row.sortOrder) || 100,
        row.active === false ? 0 : 1,
        JSON.stringify(row),
        now,
      );
    }

    db.prepare(
      `INSERT INTO sync_state(key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    ).run(`bootstrap:store:${storeId}`, now, now);
    db.prepare(
      `INSERT INTO sync_state(key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    ).run('bootstrap:storeId', String(storeId), now);

    db.exec('COMMIT');
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw err;
  }

  return {
    ok: true,
    storeId,
    categories: categories.length,
    menuItems: items.length,
    tables: tables.length,
    syncedAt: now,
  };
}

function getRestaurantBootstrapStatus(db) {
  const storeId = db.prepare(`SELECT value FROM sync_state WHERE key = ?`).get('bootstrap:storeId')?.value;
  const syncedAt = storeId
    ? db.prepare(`SELECT value FROM sync_state WHERE key = ?`).get(`bootstrap:store:${storeId}`)?.value
    : null;
  const menuCount = db.prepare(`SELECT COUNT(*) AS c FROM menu_items`).get()?.c || 0;
  const tableCount = db.prepare(`SELECT COUNT(*) AS c FROM floor_tables`).get()?.c || 0;
  const pendingPrint = db.prepare(`SELECT COUNT(*) AS c FROM print_jobs WHERE status = ?`).get('PENDING')?.c || 0;
  const unknownPrint = db.prepare(`SELECT COUNT(*) AS c FROM print_jobs WHERE status = ?`).get('UNKNOWN')?.c || 0;
  const pendingOutbox = db.prepare(
    `SELECT COUNT(*) AS c FROM outbox WHERE status IN (?, ?)`,
  ).get('PENDING', 'RETRY')?.c || 0;

  return {
    storeId: storeId != null ? Number(storeId) : null,
    lastBootstrapAt: syncedAt || null,
    bootstrapReady: Boolean(storeId) && Number(menuCount) > 0 && Number(tableCount) > 0,
    menuItemCount: Number(menuCount),
    tableCount: Number(tableCount),
    pendingPrintJobs: Number(pendingPrint),
    unknownPrintJobs: Number(unknownPrint),
    pendingOutbox: Number(pendingOutbox),
  };
}

module.exports = {
  importRestaurantBootstrap,
  getRestaurantBootstrapStatus,
};

/**
 * Read bootstrap menu / floor for offline UI (no WAN).
 */

function parseJson(raw) {
  try {
    return JSON.parse(raw || '{}') || {};
  } catch {
    return {};
  }
}

function listLocalMenuItems(db, storeId) {
  const sid = Number(storeId);
  if (!Number.isFinite(sid)) return [];
  const rows = db.prepare(
    `SELECT * FROM menu_items WHERE store_id = ? AND active = 1 ORDER BY name COLLATE NOCASE`,
  ).all(sid);
  return rows.map((row) => {
    const meta = parseJson(row.payload_json);
    const id = meta.id != null ? meta.id : (row.server_id != null ? row.server_id : row.id);
    return {
      ...meta,
      id,
      categoryId: row.category_id != null
        ? (Number.isFinite(Number(row.category_id)) ? Number(row.category_id) : row.category_id)
        : meta.categoryId,
      name: row.name || meta.name || '',
      price: Number(row.price ?? meta.price ?? meta.sellingPrice) || 0,
      sellingPrice: Number(row.price ?? meta.sellingPrice ?? meta.price) || 0,
      active: true,
    };
  });
}

function listLocalMenuCategories(db, storeId) {
  const sid = Number(storeId);
  if (!Number.isFinite(sid)) return [];
  const rows = db.prepare(
    `SELECT * FROM menu_categories WHERE store_id = ? AND active = 1 ORDER BY sort_order ASC, name COLLATE NOCASE`,
  ).all(sid);
  return rows.map((row) => {
    const meta = parseJson(row.payload_json);
    const id = meta.id != null ? meta.id : (row.server_id != null ? row.server_id : row.id);
    return {
      ...meta,
      id,
      name: row.name || meta.name || '',
      sortOrder: row.sort_order,
      autoPrint: Boolean(row.auto_print),
      printPrinterName: row.print_printer_name || meta.printPrinterName || null,
      active: true,
    };
  });
}

function uiOrderStatus(dbStatus) {
  if (dbStatus === 'ACTIVE') return 'OPEN';
  return dbStatus;
}

function listLocalFloorSnapshot(db, storeId) {
  const sid = Number(storeId);
  if (!Number.isFinite(sid)) {
    return { storeId: null, halls: [] };
  }
  const tables = db.prepare(
    `SELECT * FROM floor_tables WHERE store_id = ? AND active = 1 ORDER BY sort_order ASC, name COLLATE NOCASE`,
  ).all(sid);
  const openOrders = db.prepare(
    `SELECT * FROM orders WHERE store_id = ? AND status IN ('OPEN', 'ACTIVE', 'BILLING')`,
  ).all(sid);
  const byTable = new Map();
  for (const order of openOrders) {
    if (order.table_id == null) continue;
    const key = String(order.table_id);
    const list = byTable.get(key) || [];
    list.push(order);
    byTable.set(key, list);
  }

  /** @type {Map<string, object>} */
  const hallsMap = new Map();
  for (const row of tables) {
    const meta = parseJson(row.payload_json);
    const hallId = meta.hallId != null ? meta.hallId : (row.zone_name || 'default');
    const hallKey = String(hallId);
    const hallName = meta.hallName || row.zone_name || 'Зал';
    if (!hallsMap.has(hallKey)) {
      hallsMap.set(hallKey, {
        id: Number.isFinite(Number(hallId)) ? Number(hallId) : hallKey,
        name: hallName,
        sortOrder: Number(meta.hallSortOrder) || 0,
        active: true,
        servicePercent: meta.hallServicePercent ?? null,
        tables: [],
      });
    }

    const tableIdRaw = meta.id != null ? meta.id : (row.server_id != null ? row.server_id : row.id);
    const tableId = Number.isFinite(Number(tableIdRaw)) ? Number(tableIdRaw) : tableIdRaw;
    const orders = byTable.get(String(tableIdRaw))
      || byTable.get(String(tableId))
      || byTable.get(String(row.id))
      || [];
    const primary = orders[0] || null;
    let status = 'FREE';
    if (primary) {
      status = primary.status === 'BILLING' ? 'BILLING' : 'OCCUPIED';
    } else if (meta.status) {
      status = meta.status;
    }

    const activeOrders = orders.map((o) => ({
      id: o.id,
      status: uiOrderStatus(o.status),
      guestCount: o.guest_count,
      openedAt: o.opened_at,
      waiterUserId: o.waiter_id,
    }));

    hallsMap.get(hallKey).tables.push({
      id: tableId,
      hallId: Number.isFinite(Number(hallId)) ? Number(hallId) : null,
      hallName,
      code: meta.code || row.name || String(tableId),
      label: meta.label || meta.code || row.name || String(tableId),
      seatCount: Number(meta.seatCount) || 0,
      posX: Number(meta.posX) || 0,
      posY: Number(meta.posY) || 0,
      width: Number(meta.width) || 80,
      height: Number(meta.height) || 80,
      status,
      active: true,
      updatedAt: row.updated_at || null,
      activeOrder: activeOrders[0] || null,
      reservation: meta.reservation || null,
      servicePercent: meta.servicePercent ?? null,
      activeOrders,
    });
  }

  const halls = [...hallsMap.values()].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  return { storeId: sid, halls };
}

module.exports = {
  listLocalMenuItems,
  listLocalMenuCategories,
  listLocalFloorSnapshot,
};

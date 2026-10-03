/**
 * Create a menu item locally (offline draft). Syncs later as MENU_ITEM_UPSERT (server may ignore until supported).
 */
const { randomUUID } = require('node:crypto');
const { runInTransaction } = require('../db/tx.cjs');
const { createOutboxRepo } = require('../db/outboxRepo.cjs');

function createLocalMenuItemCommand(db, input, deps = {}) {
  const {
    idFactory = randomUUID,
    clock = () => new Date().toISOString(),
    uuid = randomUUID,
  } = deps;

  const deviceId = String(input?.deviceId || '').trim();
  if (!deviceId) throw new Error('device_id_required');
  if (input?.storeId == null) throw new Error('store_id_required');
  const name = String(input?.name || '').trim();
  if (!name) throw new Error('name_required');
  const price = Number(input?.price);
  if (!Number.isFinite(price) || price < 0) throw new Error('price_invalid');

  return runInTransaction(db, () => {
    const at = clock();
    const id = input.id ? String(input.id) : idFactory();
    const categoryId = input.categoryId != null ? String(input.categoryId) : null;
    const payload = {
      id,
      name,
      price,
      sellingPrice: price,
      categoryId,
      active: true,
      localDraft: true,
      storeId: input.storeId,
    };

    db.prepare(
      `INSERT OR REPLACE INTO menu_items(
         id, server_id, store_id, category_id, name, price, active, payload_json, updated_at
       ) VALUES (?, NULL, ?, ?, ?, ?, 1, ?, ?)`,
    ).run(
      id,
      input.storeId,
      categoryId,
      name,
      price,
      JSON.stringify(payload),
      at,
    );

    const outbox = createOutboxRepo(db, { idFactory, clock, uuid });
    const event = outbox.enqueue({
      deviceId,
      eventType: 'MENU_ITEM_UPSERT',
      clientEventId: input.clientEventId || null,
      payload: {
        id,
        storeId: input.storeId,
        categoryId,
        name,
        price,
        localDraft: true,
      },
    });

    return { id, name, price, categoryId, outboxId: event.id, clientEventId: event.clientEventId };
  });
}

module.exports = { createLocalMenuItemCommand };

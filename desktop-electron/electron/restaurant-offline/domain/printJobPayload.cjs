/**
 * B0 — immutable print_job.payload snapshot.
 * Never rebuild from live order after the job is created.
 */

const PRINT_JOB_KIND = Object.freeze({
  CATEGORY_SLIP: 'CATEGORY_SLIP',
  KITCHEN_SEND: 'KITCHEN_SEND',
  GUEST_BILL: 'GUEST_BILL',
});

/**
 * @typedef {{ name: string, qty: number, portionText?: string, note?: string, modifiers?: string[] }} PrintSnapshotItem
 * @typedef {{
 *   kind: string,
 *   orderId: string,
 *   printerName: string,
 *   station?: string,
 *   categoryName?: string,
 *   tableLabel?: string,
 *   items: PrintSnapshotItem[],
 *   createdAt: string,
 * }} PrintJobPayload
 */

/**
 * Freeze a kitchen/category slip snapshot for print_jobs.payload JSON.
 * @param {object} input
 * @returns {PrintJobPayload}
 */
function buildPrintJobPayload(input) {
  const kind = String(input?.kind || '').trim();
  const orderId = String(input?.orderId || '').trim();
  const printerName = String(input?.printerName || '').trim();
  if (!kind || !PRINT_JOB_KIND[kind] && !Object.values(PRINT_JOB_KIND).includes(kind)) {
    throw new Error(`invalid_print_job_kind:${kind}`);
  }
  if (!orderId) throw new Error('print_payload_order_id_required');
  // Empty printerName is allowed: soft-fail path inserts FAILED job (order+outbox still commit).

  const items = (Array.isArray(input.items) ? input.items : []).map((row) => {
    const name = String(row?.name || '').trim();
    const qty = Number(row?.qty);
    if (!name) throw new Error('print_payload_item_name_required');
    if (!Number.isFinite(qty) || qty <= 0) throw new Error('print_payload_item_qty_invalid');
    return Object.freeze({
      name,
      qty,
      ...(row.portionText ? { portionText: String(row.portionText) } : {}),
      ...(row.note ? { note: String(row.note) } : {}),
      ...(Array.isArray(row.modifiers) && row.modifiers.length
        ? { modifiers: Object.freeze(row.modifiers.map((m) => String(m))) }
        : {}),
    });
  });
  if (!items.length) throw new Error('print_payload_items_required');

  return Object.freeze({
    kind,
    orderId,
    printerName,
    ...(input.station ? { station: String(input.station) } : {}),
    ...(input.categoryName ? { categoryName: String(input.categoryName) } : {}),
    ...(input.tableLabel ? { tableLabel: String(input.tableLabel) } : {}),
    items: Object.freeze(items),
    createdAt: String(input.createdAt || new Date().toISOString()),
  });
}

function parsePrintJobPayload(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return buildPrintJobPayload(data);
}

module.exports = {
  PRINT_JOB_KIND,
  buildPrintJobPayload,
  parsePrintJobPayload,
};

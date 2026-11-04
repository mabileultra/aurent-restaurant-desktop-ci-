function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Same shape as backend `soldItems` on close: { from, to, items: [{ name, quantity, amount }] }.
 * Built from local SQLite sale responses when the shift closes offline.
 */
export function buildOfflineShiftSoldItems(sales, { from = null, to = null } = {}) {
  const rows = new Map();
  for (const sale of sales || []) {
    for (const line of sale?.items || []) {
      const qty = (Number(line.quantity) || 0) - (Number(line.returnedQuantity) || 0);
      if (qty <= 0) continue;
      const name = line.productName || line.name || '';
      const key = line.productSku || name;
      const row = rows.get(key) || { name, quantity: 0, amount: 0 };
      const fullQty = Number(line.quantity) || qty;
      row.quantity = round2(row.quantity + qty);
      row.amount = round2(row.amount + (Number(line.lineTotal) || 0) * (qty / fullQty));
      rows.set(key, row);
    }
  }
  const items = [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
  return { from, to, items };
}

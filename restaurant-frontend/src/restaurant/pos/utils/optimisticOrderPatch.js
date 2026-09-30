/** Optimistic order cache patches — UI updates before the API round-trip. */

function activeItems(items) {
  return (items || []).filter((row) => row.itemStatus !== 'CANCELLED');
}

function lineTotal(qty, unitPrice) {
  return Math.round((Number(qty) || 0) * (Number(unitPrice) || 0) * 100) / 100;
}

function withSubtotal(order, items) {
  const subtotal = activeItems(items).reduce((sum, row) => sum + Number(row.lineTotal || 0), 0);
  return {
    ...order,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
  };
}

function reopenIfBilling(order) {
  if (order?.status !== 'BILLING') return order;
  return {
    ...order,
    status: 'OPEN',
    serviceAmount: null,
    servicePercent: null,
  };
}

export function optimisticAddItem(order, menuItem, { note, modifierOptionIds } = {}) {
  if (!order || !menuItem) return order;
  const base = reopenIfBilling(order);
  const items = [...(base.items || [])];
  const cleanNote = note?.trim() || '';
  const noMods = !(modifierOptionIds?.length);
  if (noMods && !cleanNote) {
    const idxNew = items.findIndex((row) => (
      row.menuItemId === menuItem.id
      && row.itemStatus === 'NEW'
      && !row.note
      && !(row.modifiers?.length)
    ));
    if (idxNew >= 0) {
      const row = items[idxNew];
      const quantity = Number(row.quantity || 0) + 1;
      items[idxNew] = {
        ...row,
        quantity,
        lineTotal: lineTotal(quantity, row.unitPrice),
      };
      return withSubtotal(base, items);
    }
    const idxKitchen = items.findIndex((row) => (
      row.menuItemId === menuItem.id
      && row.itemStatus
      && row.itemStatus !== 'NEW'
      && row.itemStatus !== 'CANCELLED'
      && !row.note
      && !(row.modifiers?.length)
    ));
    if (idxKitchen >= 0) {
      const row = items[idxKitchen];
      const quantity = Number(row.quantity || 0) + 1;
      items[idxKitchen] = {
        ...row,
        quantity,
        sentQuantity: Number(row.sentQuantity) || 0,
        lineTotal: lineTotal(quantity, row.unitPrice),
      };
      return withSubtotal(base, items);
    }
  }
  const unitPrice = Number(menuItem.price) || 0;
  items.push({
    id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    menuItemId: menuItem.id,
    name: menuItem.name,
    portionText: menuItem.portionText || null,
    quantity: 1,
    returnedQuantity: 0,
    unitPrice,
    lineTotal: unitPrice,
    itemStatus: 'NEW',
    modifiers: [],
    note: cleanNote || null,
    sortOrder: items.length,
  });
  return withSubtotal(base, items);
}

export function optimisticUpdateQty(order, itemId, quantity) {
  if (!order || itemId == null) return order;
  const qty = Number(quantity);
  if (!(qty > 0)) return optimisticRemoveItem(order, itemId);
  const items = (order.items || []).map((row) => {
    if (String(row.id) !== String(itemId)) return row;
    return {
      ...row,
      quantity: qty,
      lineTotal: lineTotal(qty, row.unitPrice),
    };
  });
  return withSubtotal(order, items);
}

export function optimisticRemoveItem(order, itemId) {
  if (!order || itemId == null) return order;
  const items = (order.items || []).map((row) => {
    if (String(row.id) !== String(itemId)) return row;
    if (row.itemStatus === 'NEW' || String(row.id).startsWith('tmp-')) {
      return null;
    }
    return { ...row, itemStatus: 'CANCELLED', lineTotal: 0, quantity: 0 };
  }).filter(Boolean);
  return withSubtotal(order, items);
}

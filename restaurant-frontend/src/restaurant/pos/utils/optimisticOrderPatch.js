/** Optimistic order cache patches — UI updates before the API round-trip. */

import { isWeightSoldMenuItem, menuRefGrams, menuWeightNote } from './menuWeightSale';

function activeItems(items) {
  return (items || []).filter((row) => row.itemStatus !== 'CANCELLED');
}

function weightNoteForQty(menuItem, quantity) {
  const ref = menuRefGrams(menuItem);
  if (!ref) return null;
  const grams = Math.round(Number(quantity) * ref);
  return menuWeightNote(grams) || null;
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

export function optimisticAddItem(order, menuItem, { note, modifierOptionIds, quantity: addQty } = {}) {
  if (!order || !menuItem) return order;
  const base = reopenIfBilling(order);
  const items = [...(base.items || [])];
  const cleanNote = note?.trim() || '';
  const addQuantity = Number(addQty) > 0 ? Number(addQty) : 1;
  const noMods = !(modifierOptionIds?.length);
  const weightSold = isWeightSoldMenuItem(menuItem);

  const bumpLine = (idx, kitchen = false) => {
    const row = items[idx];
    const quantity = Math.round((Number(row.quantity || 0) + addQuantity) * 1000) / 1000;
    const weightNote = weightSold ? weightNoteForQty(menuItem, quantity) : null;
    items[idx] = {
      ...row,
      quantity,
      lineTotal: lineTotal(quantity, row.unitPrice),
      ...(kitchen ? { sentQuantity: Number(row.sentQuantity) || 0 } : {}),
      ...(weightNote ? { note: weightNote, portionText: weightNote } : {}),
    };
    return withSubtotal(base, items);
  };

  const sameMenu = (row) => String(row.menuItemId) === String(menuItem.id);

  if (noMods && weightSold) {
    const idxNew = items.findIndex((row) => (
      sameMenu(row)
      && row.itemStatus === 'NEW'
      && !(row.modifiers?.length)
    ));
    if (idxNew >= 0) return bumpLine(idxNew);
    const idxKitchen = items.findIndex((row) => (
      sameMenu(row)
      && row.itemStatus
      && row.itemStatus !== 'NEW'
      && row.itemStatus !== 'CANCELLED'
      && !(row.modifiers?.length)
    ));
    if (idxKitchen >= 0) return bumpLine(idxKitchen, true);
  } else if (noMods && !cleanNote && addQuantity === 1) {
    const idxNew = items.findIndex((row) => (
      sameMenu(row)
      && row.itemStatus === 'NEW'
      && !row.note
      && !(row.modifiers?.length)
    ));
    if (idxNew >= 0) return bumpLine(idxNew);
    const idxKitchen = items.findIndex((row) => (
      sameMenu(row)
      && row.itemStatus
      && row.itemStatus !== 'NEW'
      && row.itemStatus !== 'CANCELLED'
      && !row.note
      && !(row.modifiers?.length)
    ));
    if (idxKitchen >= 0) return bumpLine(idxKitchen, true);
  }

  const unitPrice = Number(menuItem.price) || 0;
  const weightNote = weightSold ? weightNoteForQty(menuItem, addQuantity) : null;
  const lineNote = weightNote || cleanNote || null;
  items.push({
    id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    menuItemId: menuItem.id,
    name: menuItem.name,
    portionText: lineNote || menuItem.portionText || null,
    quantity: addQuantity,
    returnedQuantity: 0,
    unitPrice,
    lineTotal: lineTotal(addQuantity, unitPrice),
    itemStatus: 'NEW',
    modifiers: [],
    note: lineNote,
    sortOrder: items.length,
  });
  return withSubtotal(base, items);
}

function rescaleWeightNote(note, oldQty, newQty) {
  const match = String(note || '').trim().match(/^(\d+)\s*(г|кг)$/i);
  if (!match || !(Number(oldQty) > 0) || !(Number(newQty) > 0)) return note || null;
  let grams = Number(match[1]);
  if (/кг/i.test(match[2])) grams *= 1000;
  const next = Math.max(1, Math.round(grams * (Number(newQty) / Number(oldQty))));
  return menuWeightNote(next) || null;
}

export function optimisticUpdateQty(order, itemId, quantity) {
  if (!order || itemId == null) return order;
  const qty = Number(quantity);
  if (!(qty > 0)) return optimisticRemoveItem(order, itemId);
  const items = (order.items || []).map((row) => {
    if (String(row.id) !== String(itemId)) return row;
    const weightNote = rescaleWeightNote(row.note, row.quantity, qty);
    return {
      ...row,
      quantity: qty,
      lineTotal: lineTotal(qty, row.unitPrice),
      ...(weightNote ? { note: weightNote, portionText: weightNote } : {}),
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

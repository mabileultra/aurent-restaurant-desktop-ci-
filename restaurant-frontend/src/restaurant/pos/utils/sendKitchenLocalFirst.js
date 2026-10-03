import {
  isRestaurantLocalFirstOn,
  rstOfflineSendToKitchen,
} from '../../../services/offline/restaurantOfflineBridge';
import { buildLocalKitchenSendGroups } from './buildLocalKitchenSendGroups';

function pendingItemsFromOrder(order) {
  return (order?.items || [])
    .map((item) => {
      if (!item || item.itemStatus === 'CANCELLED') return null;
      const qty = Number(item.quantity) || 0;
      const sent = item.itemStatus === 'NEW'
        ? 0
        : (item.sentQuantity == null ? qty : (Number(item.sentQuantity) || 0));
      const left = qty - sent;
      if (left <= 0) return null;
      return {
        name: item.name || '',
        qty: left,
        unitPrice: Number(item.unitPrice ?? item.price) || 0,
        menuItemId: item.menuItemId != null ? String(item.menuItemId) : null,
        portionText: item.portionText || null,
        note: item.note || null,
        modifiers: (item.modifiers || [])
          .map((m) => (typeof m === 'string' ? m : (m.name || m.optionName || '')))
          .filter(Boolean),
      };
    })
    .filter(Boolean);
}

/**
 * Local-first kitchen send: desktop → SQLite+print; waiter PWA → IDB+server print on sync.
 */
export async function sendKitchenLocalFirst({
  order,
  storeId,
  categories = [],
  tableLabel,
}) {
  if (!isRestaurantLocalFirstOn()) {
    return null;
  }
  if (order?.id == null) {
    throw new Error('order_required');
  }

  const { groups, error } = await buildLocalKitchenSendGroups(order, categories);
  if (error === 'no_pending_items') {
    throw new Error('no_pending_items');
  }

  // Waiter PWA / non-desktop: one outbox event with printOnServer (no local ESC/POS).
  if (error === 'not_desktop') {
    const items = pendingItemsFromOrder(order);
    if (!items.length) throw new Error('no_pending_items');
    const res = await rstOfflineSendToKitchen({
      storeId,
      tableId: order.tableId != null ? String(order.tableId) : null,
      tableLabel: tableLabel || order.tableCode || order.tableName || '',
      orderId: String(order.id),
      printerName: '',
      items,
      waiterId: order.waiterUserId != null ? String(order.waiterUserId) : null,
      printOnServer: true,
    });
    return {
      results: [res],
      printers: [],
      printFailed: true,
      order: res?.order,
    };
  }

  if (!groups.length) {
    throw new Error('no_pending_items');
  }

  const results = [];
  for (const group of groups) {
    const res = await rstOfflineSendToKitchen({
      storeId,
      tableId: order.tableId != null ? String(order.tableId) : null,
      tableLabel: tableLabel || order.tableCode || order.tableName || '',
      orderId: String(order.id),
      printerName: group.printerName || '',
      station: group.station,
      categoryName: group.categoryName,
      items: group.items,
      waiterId: order.waiterUserId != null ? String(order.waiterUserId) : null,
    });
    results.push(res);
  }
  const printFailed = results.some((r) => r?.printOk === false);
  return {
    results,
    printers: groups.map((g) => g.printerName).filter(Boolean),
    printFailed,
  };
}

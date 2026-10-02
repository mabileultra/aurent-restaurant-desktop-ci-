import {
  isRestaurantLocalFirstDesktop,
  isRestaurantOfflineBridge,
  rstOfflineSendToKitchen,
} from '../../../services/offline/restaurantOfflineBridge';
import { buildLocalKitchenSendGroups } from './buildLocalKitchenSendGroups';

/**
 * Local-first kitchen send: SQLite TX + print queue on this PC.
 * Returns null if local-first is off / unavailable.
 */
export async function sendKitchenLocalFirst({
  order,
  storeId,
  categories = [],
  tableLabel,
}) {
  if (!isRestaurantLocalFirstDesktop() || !isRestaurantOfflineBridge()) {
    return null;
  }
  if (order?.id == null) {
    throw new Error('order_required');
  }

  const { groups, error } = await buildLocalKitchenSendGroups(order, categories);
  if (error === 'no_pending_items') {
    throw new Error('no_pending_items');
  }
  if (!groups.length) {
    throw new Error(error === 'not_desktop' ? 'not_desktop' : 'no_printer_for_kitchen');
  }

  const results = [];
  for (const group of groups) {
    const res = await rstOfflineSendToKitchen({
      storeId,
      tableId: order.tableId != null ? String(order.tableId) : null,
      tableLabel: tableLabel || order.tableCode || order.tableName || '',
      orderId: String(order.id),
      printerName: group.printerName,
      station: group.station,
      categoryName: group.categoryName,
      items: group.items,
      waiterId: order.waiterUserId != null ? String(order.waiterUserId) : null,
    });
    results.push(res);
  }
  return { results, printers: groups.map((g) => g.printerName) };
}

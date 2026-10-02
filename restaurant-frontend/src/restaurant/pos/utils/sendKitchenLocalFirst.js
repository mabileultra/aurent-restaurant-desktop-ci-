import {
  isRestaurantLocalFirstDesktop,
  isRestaurantOfflineBridge,
  rstOfflineSendToKitchen,
} from '../../../services/offline/restaurantOfflineBridge';
import { buildLocalKitchenSendGroups } from './buildLocalKitchenSendGroups';

/**
 * Local-first kitchen send: SQLite TX + print queue on this PC.
 * Returns null if local-first is off / unavailable.
 * Missing printer: still commits locally (printOk=false); does not block send.
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
  if (error === 'not_desktop') {
    throw new Error('not_desktop');
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

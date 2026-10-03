import {
  isRestaurantLocalFirstOn,
  rstOfflineSendToKitchen,
} from '../../../services/offline/restaurantOfflineBridge';
import { buildLocalKitchenSendGroups } from './buildLocalKitchenSendGroups';
import { listDesktopPrintersCached } from './desktopPrinters';

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
        id: item.id != null ? String(item.id) : undefined,
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

function localPrinterSet(list) {
  return new Set(
    (Array.isArray(list) ? list : [])
      .map((p) => String(p?.name || p).trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Local-first kitchen send: print on this PC only when Windows has the printer;
 * otherwise printOnServer so the cashier/hub station claims classic relay jobs.
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
      itemIds: items.map((i) => i.id).filter(Boolean),
      waiterId: order.waiterUserId != null ? String(order.waiterUserId) : null,
      printOnServer: true,
    });
    return {
      results: [res],
      printers: [],
      printFailed: false,
      needsRelay: true,
      order: res?.order,
    };
  }

  if (!groups.length) {
    throw new Error('no_pending_items');
  }

  let windowsPrinters = [];
  try {
    windowsPrinters = await listDesktopPrintersCached();
  } catch {
    windowsPrinters = [];
  }
  const localNames = localPrinterSet(windowsPrinters);

  const results = [];
  let needsRelay = false;
  for (const group of groups) {
    const name = String(group.printerName || '').trim();
    // Monoblock: always spool locally when a kitchen printer is configured.
    // Exact Windows-name match is done later by ESC/POS matchPrinterName —
    // requiring it here skipped jobs entirely (printOnServer + no local slip).
    const knownLocal = Boolean(name && localNames.has(name.toLowerCase()));
    const printOnServer = !name;
    if (printOnServer || !knownLocal) needsRelay = Boolean(printOnServer);
    const res = await rstOfflineSendToKitchen({
      storeId,
      tableId: order.tableId != null ? String(order.tableId) : null,
      tableLabel: tableLabel || order.tableCode || order.tableName || '',
      orderId: String(order.id),
      printerName: name,
      station: group.station,
      categoryName: group.categoryName,
      items: group.items,
      itemIds: group.items.map((i) => i.id).filter(Boolean),
      waiterId: order.waiterUserId != null ? String(order.waiterUserId) : null,
      printOnServer,
    });
    results.push(res);
  }
  // Only real local spool failures — missing printer on a satellite is relay, not failure.
  const printFailed = results.some((r) => r?.printOk === false && r?.printOnServer !== true);
  return {
    results,
    printers: groups.map((g) => g.printerName).filter(Boolean),
    printFailed,
    needsRelay,
  };
}

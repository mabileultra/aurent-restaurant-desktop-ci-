/**
 * Build local-first kitchen send payloads from a floor order + desktop printer map.
 * One payload per printer (station or category autoPrint).
 */
import {
  getDesktopPrinterSettings,
  isDesktopPrinter,
} from './desktopPrinters';
import { resolveStationPrinter } from './printKitchenTicket';

function pendingQty(item) {
  const qty = Number(item?.quantity) || 0;
  const sent = Number(item?.sentQuantity) || 0;
  const left = qty - sent;
  return left > 0 ? left : 0;
}

function itemSnapshot(item, qty) {
  return {
    name: item.name || '',
    qty,
    unitPrice: Number(item.unitPrice ?? item.price) || 0,
    menuItemId: item.menuItemId != null ? String(item.menuItemId) : null,
    portionText: item.portionText || null,
    note: item.note || null,
    modifiers: (item.modifiers || [])
      .map((m) => (typeof m === 'string' ? m : (m.name || m.optionName || '')))
      .filter(Boolean),
  };
}

/**
 * @param {object} order
 * @param {object[]} [categories] — menu categories with autoPrint / printPrinterName
 * @returns {Promise<{ groups: object[], error?: string }>}
 */
export async function buildLocalKitchenSendGroups(order, categories = []) {
  if (!isDesktopPrinter()) {
    return { groups: [], error: 'not_desktop' };
  }
  const settings = await getDesktopPrinterSettings().catch(() => null);
  const stationMap = settings?.stationPrinters || {};
  const catById = new Map(
    (Array.isArray(categories) ? categories : [])
      .map((c) => [String(c.id), c]),
  );

  /** @type {Map<string, { printerName: string, station?: string, categoryName?: string, items: object[] }>} */
  const byPrinter = new Map();
  /** @type {{ item: object, qty: number }[]} */
  const unassigned = [];

  const pending = (order?.items || [])
    .map((item) => ({ item, qty: pendingQty(item) }))
    .filter((row) => row.qty > 0);

  if (!pending.length) {
    return { groups: [], error: 'no_pending_items' };
  }

  for (const { item, qty } of pending) {
    const cat = item.categoryId != null ? catById.get(String(item.categoryId)) : null;
    let printerName = '';
    let station;
    let categoryName;

    if (cat?.autoPrint && String(cat.printPrinterName || '').trim()) {
      printerName = String(cat.printPrinterName).trim();
      categoryName = cat.name || undefined;
    } else {
      printerName = resolveStationPrinter(stationMap, item.stationId);
      station = item.stationId != null ? String(item.stationId) : undefined;
    }

    if (!printerName) {
      // Fallback: single configured kitchen printer
      printerName = resolveStationPrinter(stationMap, null);
    }
    if (!printerName) {
      unassigned.push({ item, qty });
      continue;
    }

    const key = printerName.toLowerCase();
    if (!byPrinter.has(key)) {
      byPrinter.set(key, {
        printerName,
        station,
        categoryName,
        items: [],
      });
    }
    byPrinter.get(key).items.push(itemSnapshot(item, qty));
  }

  // Soft-fail group: empty printerName → local TX still COMMITs, print_job FAILED.
  if (unassigned.length) {
    byPrinter.set('\0unassigned', {
      printerName: '',
      items: unassigned.map(({ item, qty }) => itemSnapshot(item, qty)),
    });
  }

  return { groups: [...byPrinter.values()] };
}

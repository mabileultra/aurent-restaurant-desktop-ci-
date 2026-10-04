/**
 * Guest pre-check when the bill is requested. Silent on this computer's bill printer.
 */
import { rstShiftApi } from '../../api/shift.api';
import {
  getDesktopPrinterSettings,
  isDesktopPrinter,
  printTicketLines,
} from './desktopPrinters';
import { buildRestaurantTicketBody } from './buildRestaurantTicketBody';
import { resolvePrintWaiterName } from './printWaiterNames';

async function loadCurrentShift(storeId) {
  if (storeId == null) return null;
  try {
    const res = await rstShiftApi.current(storeId);
    return res.status === 204 ? null : (res.data ?? null);
  } catch {
    return null;
  }
}

export async function printGuestBill({
  order, t, waiterNameById, shift = null, header = null,
} = {}) {
  if (!order || !isDesktopPrinter()) return { mode: 'skip' };
  const settings = await getDesktopPrinterSettings();
  const printer = settings?.billPrinterName || '';
  if (!printer) return { mode: 'missing' };

  const title = t?.('rst.order.requestBill', { defaultValue: 'Счёт' }) || 'Счёт';
  const resolvedShift = shift || await loadCurrentShift(order.storeId);
  const waiterName = await resolvePrintWaiterName(
    order.storeId,
    order.waiterUserId,
    waiterNameById,
  );

  const body = buildRestaurantTicketBody({
    kind: 'bill',
    order,
    t,
    shift: resolvedShift,
    waiterName,
    header,
    // Pre-check: no payment / no OFD QR
    paymentMethod: null,
    qrValue: '',
  });

  await printTicketLines({
    title,
    printerName: printer,
    lines: body,
  });
  return { mode: 'silent' };
}

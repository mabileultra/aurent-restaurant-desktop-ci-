import { assertSalePrescriptionNumber } from '@aurent/shared-fiscal';
import { refreshConnectivityStatus, useConnectivityStore } from '../../store/connectivityStore';
import { roundQty } from '../../utils/quantityFormat';
import { hasLocalPosCatalog } from '../offline/connectivityRules';
import { isDesktopOfflineBridge, offlineCompleteCheckout } from '../offline/desktopOfflineBridge';
import { resolveOfflineCheckoutTimeoutMs } from './posCheckoutTimeouts';
import {
  buildOfflineCheckoutPayload,
  buildOfflineSaleResponse,
} from '../offline/buildOfflineSaleResponse';
import { logSale } from '../desktop/activityLog';

export function buildOfflineStockLines(checkoutItems = []) {
  const byProductKey = new Map();
  for (const item of checkoutItems || []) {
    if (item?.productId == null) continue;
    const qty = roundQty(item.quantity);
    if (qty <= 0) continue;
    const key = String(item.productId);
    const existing = byProductKey.get(key);
    if (existing) {
      existing.quantity = roundQty(existing.quantity + qty);
    } else {
      byProductKey.set(key, { productId: item.productId, quantity: qty });
    }
  }
  return Array.from(byProductKey.values());
}

function withCheckoutTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('offline_checkout_timeout')),
        resolveOfflineCheckoutTimeoutMs(),
      );
    }),
  ]);
}

function newClientSaleId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `off-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function processOfflineCheckout({
  storeId,
  payment,
  user,
  cachedShift,
  storeName,
  getCheckoutOrderDiscountAmount,
  getCheckoutOrderDiscountPercent,
  items,
  fiscal = null,
  printFiscalQr = true,
}) {
  // Офлайн-продажа рецептурного препарата без номера рецепта не сохраняется.
  assertSalePrescriptionNumber(items, payment);

  if (!isDesktopOfflineBridge()) {
    throw new Error('OFFLINE_SALE_SAVE_FAILED');
  }

  if (!hasLocalPosCatalog(useConnectivityStore.getState(), storeId)) {
    throw new Error('OFFLINE_SALE_SAVE_FAILED');
  }

  const clientSaleId = newClientSaleId();
  const receiptNumber = `OFF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;
  const orderDiscountAmount = getCheckoutOrderDiscountAmount();
  const orderDiscountPercent = getCheckoutOrderDiscountPercent();

  const payload = buildOfflineCheckoutPayload({
    storeId,
    payment,
    cartItems: items,
    orderDiscountAmount,
    orderDiscountPercent,
    fiscal,
  });

  const response = buildOfflineSaleResponse({
    clientSaleId,
    receiptNumber,
    payment,
    customerName: payment.customerName,
    storeId,
    storeName: storeName || cachedShift?.storeName || '',
    cashierName: user?.fullName || user?.username || cachedShift?.cashierName || '',
    shift: cachedShift,
    cartItems: items,
    orderDiscountAmount,
    orderDiscountPercent,
    fiscal,
    printFiscalQr,
  });

  const saved = await withCheckoutTimeout(
    offlineCompleteCheckout({
      storeId,
      cashierId: user?.id,
      cashierName: user?.fullName || user?.username || '',
      storeName: storeName || cachedShift?.storeName || '',
      cachedShift,
      payload,
      response,
      stockLines: buildOfflineStockLines(payload.items),
    }),
  );

  if (!saved?.clientSaleId) {
    throw new Error('OFFLINE_SALE_SAVE_FAILED');
  }

  logSale('Офлайн-продажа сохранена локально', {
    clientSaleId: saved.clientSaleId,
    receiptNumber: saved.receiptNumber || response.receiptNumber,
    storeId,
    items: items?.length || 0,
    fiscalStatus: fiscal?.fiscalStatus || null,
  });

  void refreshConnectivityStatus();
  return { data: { ...response, receiptNumber: saved.receiptNumber || response.receiptNumber } };
}

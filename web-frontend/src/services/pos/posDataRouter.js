/**
 * Единый роутер POS: все операции кассы идут через этот модуль (API или SQLite).
 */
import { categoryApi, productApi, saleApi, cashierShiftApi } from '../api';
import { buildTerminalRequest, resolveCashierTerminalIdentity } from '../../utils/cashierTerminalIdentity';
import { POS_PRODUCT_PAGE_SIZE } from '../../features/cashier/components/pos/posCatalogConstants';
import { POS_CATALOG_ONLINE_TIMEOUT_MS } from '../offline/posCatalogConstants';
import { isApiUnreachableError } from '../../utils/apiNetworkError';
import { isDesktopOfflineBridge } from '../offline/desktopOfflineBridge';
import {
  offlineGetProductByBarcode,
  offlineListCategories,
  offlineSearchProducts,
  offlineGetCurrentShift,
  offlineOpenShift,
  offlineCloseShift,
  offlineSyncShiftFromServer,
  offlineListMySales,
} from '../offline/desktopOfflineBridge';
import { processOfflineCheckout } from './offlineCheckout';
import { useConnectivityStore } from '../../store/connectivityStore';
import { resolvePosRoute } from './posRouteResolver';
import {
  fiscalizeSaleBeforeCommit,
  fiscalizeShiftOperation,
  loadMultikassaCapabilities,
  wrapMultikassaFiscalError,
} from '../multikassa';
import { lineSubtotal } from '../../store/cartStore';
import { round2 } from '../../utils/taxAmounts';
import { buildPharmacySaleExtras } from '../../features/pharmacy-cashier/utils/buildPharmacySaleExtras';

function connectivityState() {
  return useConnectivityStore.getState();
}

function routeFor(storeId) {
  return resolvePosRoute(storeId, connectivityState());
}

function onlineCatalogConfig(signal) {
  return {
    timeout: POS_CATALOG_ONLINE_TIMEOUT_MS,
    ...(signal ? { signal } : {}),
  };
}

async function withRemoteFallback(storeId, remoteFn, localFn) {
  const { route, canFallback } = routeFor(storeId);
  if (route === 'local') {
    return localFn();
  }
  try {
    return await remoteFn();
  } catch (err) {
    if (canFallback && isDesktopOfflineBridge() && isApiUnreachableError(err)) {
      return localFn();
    }
    throw err;
  }
}

function buildOfflineProductsPage(content, pageParam) {
  const total =
    content.length < POS_PRODUCT_PAGE_SIZE
      ? pageParam + content.length
      : pageParam + content.length + 1;
  return {
    content,
    number: pageParam / POS_PRODUCT_PAGE_SIZE,
    totalPages:
      content.length < POS_PRODUCT_PAGE_SIZE
        ? pageParam / POS_PRODUCT_PAGE_SIZE + 1
        : pageParam / POS_PRODUCT_PAGE_SIZE + 2,
    totalElements: total,
  };
}

export function getPosCatalogMode(storeId) {
  return routeFor(storeId).route === 'local' ? 'offline' : 'online';
}

export async function posFetchCategories({ storeId, signal } = {}) {
  return withRemoteFallback(
    storeId,
    () => categoryApi.getAll(onlineCatalogConfig(signal)).then((r) => r.data),
    () => offlineListCategories(),
  );
}

export async function posFetchProductsPage({
  storeId,
  categoryId,
  search,
  pageParam,
  signal,
}) {
  const trimmedSearch = search?.trim() || '';
  return withRemoteFallback(
    storeId,
    () =>
      productApi
        .getAll(
          {
            storeId,
            categoryId,
            search: trimmedSearch || undefined,
            page: pageParam,
            size: POS_PRODUCT_PAGE_SIZE,
            activeOnly: true,
          },
          onlineCatalogConfig(signal),
        )
        .then((r) => r.data),
    async () => {
      const content = await offlineSearchProducts({
        search: trimmedSearch,
        categoryId,
        limit: POS_PRODUCT_PAGE_SIZE,
        offset: pageParam,
      });
      return buildOfflineProductsPage(content, pageParam);
    },
  );
}

export function posProductsNextPageParam(lastPage, lastPageParam, storeId = null) {
  const useLocal = routeFor(storeId).route === 'local';
  const next = (lastPage?.number ?? 0) + 1;
  const total = lastPage?.totalPages ?? 0;
  return next < total ? (useLocal ? lastPageParam + POS_PRODUCT_PAGE_SIZE : next) : undefined;
}

export async function posFetchProductByBarcode(storeId, barcode) {
  const trimmed = String(barcode || '').trim();
  if (!trimmed) return null;
  return withRemoteFallback(
    storeId,
    () => productApi.getByBarcode(trimmed, storeId).then((r) => r.data),
    () => offlineGetProductByBarcode(trimmed),
  );
}

export async function posFetchCurrentShift(storeId, user, storeName = '') {
  const { route } = routeFor(storeId);
  if (route === 'local' && user?.id) {
    return offlineGetCurrentShift({ storeId, cashierId: user.id });
  }
  try {
    const res = await cashierShiftApi.current(storeId);
    const shift = res.data;
    if (shift?.status === 'OPEN' && user?.id && isDesktopOfflineBridge()) {
      try {
        await offlineSyncShiftFromServer({
          shift,
          storeId,
          cashierId: user.id,
          cashierName: user.fullName || user.username || '',
          storeName: storeName || shift.storeName || '',
        });
      } catch {
        /* mirror best-effort */
      }
    }
    return shift;
  } catch (e) {
    if (e.response?.status === 404) {
      if (isDesktopOfflineBridge() && user?.id) {
        try {
          await offlineCloseShift({ storeId, cashierId: user.id });
        } catch {
          /* ignore */
        }
      }
      return null;
    }
    if (isApiUnreachableError(e) && routeFor(storeId).canFallback && user?.id) {
      return offlineGetCurrentShift({ storeId, cashierId: user.id });
    }
    throw e;
  }
}

export async function posOpenShift(storeId, user, storeName = '') {
  const { route } = routeFor(storeId);
  if (route === 'local') {
    const shift = await offlineOpenShift({
      storeId,
      cashierId: user?.id,
      cashierName: user?.fullName || user?.username || '',
      storeName,
    });
    if (!shift) throw new Error('OFFLINE_SHIFT_OPEN_FAILED');
    return shift;
  }
  try {
    const identity = await resolveCashierTerminalIdentity();
    const terminal = buildTerminalRequest(identity);
    const body = terminal ? { terminal } : null;
    const res = await cashierShiftApi.open(storeId, body);
    const shift = res.data;
    if (isDesktopOfflineBridge() && user?.id) {
      try {
        await offlineSyncShiftFromServer({
          shift,
          storeId,
          cashierId: user.id,
          cashierName: user.fullName || user.username || '',
          storeName: storeName || shift.storeName || '',
        });
      } catch {
        /* ignore */
      }
    }

    try {
      const capabilities = await loadMultikassaCapabilities(storeId, shift?.cashRegisterId);
      await fiscalizeShiftOperation({
        kind: 'open',
        capabilities,
        shiftId: shift?.id,
        cashierName: user?.fullName || user?.username || shift?.cashierName || 'CASHIER',
        zReportNumber: shift?.zReportId,
      });
    } catch (fiscalErr) {
      try {
        await cashierShiftApi.close(shift.id);
      } catch {
        /* best-effort rollback */
      }
      if (isDesktopOfflineBridge() && user?.id) {
        try {
          await offlineCloseShift({ storeId, cashierId: user.id });
        } catch {
          /* ignore */
        }
      }
      throw wrapMultikassaFiscalError(fiscalErr);
    }

    return shift;
  } catch (e) {
    if (e?.code === 'MULTIKASSA_FISCAL_FAILED' || e?.code === 'MULTIKASSA_OFFLINE_BLOCKED') {
      throw e;
    }
    const msg = String(e.response?.data?.message ?? '');
    if (e.response?.status === 400 && /открыта/i.test(msg)) {
      const res = await cashierShiftApi.current(storeId);
      return res.data;
    }
    if (isApiUnreachableError(e) && routeFor(storeId).canFallback && user?.id) {
      const shift = await offlineOpenShift({
        storeId,
        cashierId: user.id,
        cashierName: user.fullName || user.username || '',
        storeName,
      });
      if (!shift) throw new Error('OFFLINE_SHIFT_OPEN_FAILED');
      return shift;
    }
    throw e;
  }
}

export async function posCloseShift(shiftId, storeId, user, shiftHint = null) {
  const { route } = routeFor(storeId);
  if (route === 'local' && user?.id) {
    await offlineCloseShift({ storeId, cashierId: user.id });
    return { id: shiftId, status: 'CLOSED' };
  }

  try {
    const capabilities = await loadMultikassaCapabilities(
      storeId,
      shiftHint?.cashRegisterId ?? null,
    );
    await fiscalizeShiftOperation({
      kind: 'close',
      capabilities,
      shiftId,
      cashierName: user?.fullName || user?.username || shiftHint?.cashierName || 'CASHIER',
      zReportNumber: shiftHint?.zReportId,
    });
  } catch (fiscalErr) {
    throw wrapMultikassaFiscalError(fiscalErr);
  }

  const closed = await cashierShiftApi.close(shiftId).then((r) => r.data);
  if (isDesktopOfflineBridge() && user?.id) {
    try {
      await offlineCloseShift({ storeId, cashierId: user.id });
    } catch {
      /* ignore */
    }
  }
  return closed;
}

export async function posXReport(shiftId, storeId, user, shiftHint = null) {
  try {
    const capabilities = await loadMultikassaCapabilities(
      storeId,
      shiftHint?.cashRegisterId ?? null,
    );
    await fiscalizeShiftOperation({
      kind: 'x',
      capabilities,
      shiftId,
      cashierName: user?.fullName || user?.username || shiftHint?.cashierName || 'CASHIER',
    });
  } catch (fiscalErr) {
    throw wrapMultikassaFiscalError(fiscalErr);
  }
  return cashierShiftApi.xReport(shiftId).then((r) => r.data);
}

export async function posCreateSale({
  storeId,
  payment,
  user,
  cachedShift,
  storeName,
  getCheckoutLineItems,
  getCheckoutOrderDiscountAmount,
  getCheckoutOrderDiscountPercent,
  items,
}) {
  const { route } = routeFor(storeId);
  const offline = route === 'local';
  const cartItems = items || [];
  const linesTotal = round2(cartItems.reduce((acc, item) => acc + lineSubtotal(item), 0));
  const orderDiscount = round2(
    Math.min(Math.max(0, Number(getCheckoutOrderDiscountAmount?.() || 0)), linesTotal),
  );
  const total = round2(Math.max(0, linesTotal - orderDiscount));
  const clientSaleId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `sale-${Date.now()}`;

  let fiscalPayload = null;
  try {
    const cashRegisterId = cachedShift?.cashRegisterId ?? null;
    const capabilities = await loadMultikassaCapabilities(storeId, cashRegisterId, {
      allowLoadFailureAsDisabled: offline,
    });
    fiscalPayload = await fiscalizeSaleBeforeCommit({
      capabilities,
      cartItems,
      payment,
      total,
      shiftId: cachedShift?.id,
      cashierName: user?.fullName || user?.name || 'CASHIER',
      contractorName: storeName,
      offline,
      clientSaleId,
    });
  } catch (err) {
    throw wrapMultikassaFiscalError(err);
  }

  const fiscalForApi = fiscalPayload
    ? {
        fiscalStatus: fiscalPayload.fiscalStatus,
        fiscalSign: fiscalPayload.fiscalSign,
        fiscalReceiptSeq: fiscalPayload.fiscalReceiptSeq,
        multikassaSaleId: fiscalPayload.multikassaSaleId,
        fiscalQrUrl: fiscalPayload.fiscalQrUrl,
        fiscalError: fiscalPayload.fiscalError,
        fiscalTerminalId: fiscalPayload.fiscalTerminalId || fiscalPayload.terminalId || null,
      }
    : null;

  if (offline) {
    return processOfflineCheckout({
      storeId,
      payment,
      user,
      cachedShift,
      storeName,
      getCheckoutOrderDiscountAmount,
      getCheckoutOrderDiscountPercent,
      items,
      fiscal: fiscalPayload || undefined,
    });
  }

  const onlineTimeout = isDesktopOfflineBridge()
    ? POS_CATALOG_ONLINE_TIMEOUT_MS + 2_000
    : undefined;

  try {
    const pharmacyExtras = buildPharmacySaleExtras(payment);
    return await saleApi.create(
      {
        storeId: Number(storeId),
        paymentMethod: payment.paymentMethod,
        receiptType: payment.receiptType,
        cardType: payment.cardType,
        cashAmount: payment.cashAmount,
        cardAmount: payment.cardAmount,
        amountTendered: payment.amountTendered,
        customerId: payment.customerId || undefined,
        advanceAmount: payment.advanceAmount || undefined,
        items: getCheckoutLineItems(),
        orderDiscountAmount: getCheckoutOrderDiscountAmount(),
        orderDiscountPercent: getCheckoutOrderDiscountPercent(),
        ...(pharmacyExtras?.notes ? { notes: pharmacyExtras.notes } : {}),
        ...(pharmacyExtras?.patientPinfl ? { patientPinfl: pharmacyExtras.patientPinfl } : {}),
        ...(pharmacyExtras?.loyaltyPhone ? { loyaltyPhone: pharmacyExtras.loyaltyPhone } : {}),
        ...(pharmacyExtras?.pharmacyDmed ? { pharmacyDmed: true } : {}),
        ...(fiscalForApi ? { fiscal: fiscalForApi } : {}),
      },
      onlineTimeout ? { timeout: onlineTimeout } : undefined,
    );
  } catch (err) {
    if (isApiUnreachableError(err) && routeFor(storeId).canFallback) {
      return processOfflineCheckout({
        storeId,
        payment,
        user,
        cachedShift,
        storeName,
        getCheckoutOrderDiscountAmount,
        getCheckoutOrderDiscountPercent,
        items,
        fiscal: fiscalPayload || undefined,
      });
    }
    throw err;
  }
}

export async function posFetchMySales(storeId, params = {}) {
  const { route } = routeFor(storeId);
  if (route === 'local') {
    const rows = await offlineListMySales({ shiftId: params.shiftId, limit: params.size || 50 });
    return {
      content: rows,
      number: params.page || 0,
      totalPages: 1,
      totalElements: rows.length,
    };
  }
  try {
    return await saleApi.mySales(params).then((r) => r.data);
  } catch (err) {
    if (isApiUnreachableError(err) && routeFor(storeId).canFallback) {
      const rows = await offlineListMySales({ shiftId: params.shiftId, limit: params.size || 50 });
      return {
        content: rows,
        number: params.page || 0,
        totalPages: 1,
        totalElements: rows.length,
      };
    }
    throw err;
  }
}

export { resolvePosRoute, routeFor };

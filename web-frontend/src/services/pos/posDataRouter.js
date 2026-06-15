/**
 * Единый роутер POS: все операции кассы идут через этот модуль (API или SQLite).
 */
import { categoryApi, productApi, saleApi, cashierShiftApi } from '../api';
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
    const res = await cashierShiftApi.open(storeId);
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
    return shift;
  } catch (e) {
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

export async function posCloseShift(shiftId, storeId, user) {
  const { route } = routeFor(storeId);
  if (route === 'local' && user?.id) {
    await offlineCloseShift({ storeId, cashierId: user.id });
    return { id: shiftId, status: 'CLOSED' };
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

  if (route === 'local') {
    return processOfflineCheckout({
      storeId,
      payment,
      user,
      cachedShift,
      storeName,
      getCheckoutOrderDiscountAmount,
      getCheckoutOrderDiscountPercent,
      items,
    });
  }

  const onlineTimeout = isDesktopOfflineBridge()
    ? POS_CATALOG_ONLINE_TIMEOUT_MS + 2_000
    : undefined;

  try {
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

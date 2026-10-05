/**
 * Единый роутер POS: все операции кассы идут через этот модуль (API или SQLite).
 */
import { categoryApi, productApi, saleApi, cashierShiftApi, pharmacyWarehouseApi, pharmacySalesApi, pharmacyShiftApi } from '../api';
import { cashierTerminalApi } from '../../api/cashierTerminal.api';
import { buildTerminalRequest, resolveCashierTerminalIdentity } from '../../utils/cashierTerminalIdentity';
import { POS_PRODUCT_PAGE_SIZE, posCatalogPageSize } from '../../features/cashier/components/pos/posCatalogConstants';
import { isApiUnreachableError } from '../../utils/apiNetworkError';
import { isDesktopOfflineBridge } from '../offline/desktopOfflineBridge';
import { resolveOnlineCatalogTimeoutMs, resolveOnlineSaleTimeoutMs } from './posCheckoutTimeouts';
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
  isFiscalShiftAlreadyOpenError,
  loadMultikassaCapabilities,
  wrapMultikassaFiscalError,
} from '../multikassa';
import { lineSubtotal } from '../../store/cartStore';
import { round2 } from '../../utils/taxAmounts';
import { buildPharmacySaleExtras } from '../../features/pharmacy-cashier/utils/buildPharmacySaleExtras';
import { buildShiftPrintReport } from '../../features/cashier/utils/buildShiftPrintReport';

function connectivityState() {
  return useConnectivityStore.getState();
}

function routeFor(storeId) {
  return resolvePosRoute(storeId, connectivityState());
}

function onlineCatalogConfig(signal) {
  return {
    timeout: resolveOnlineCatalogTimeoutMs(),
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

function buildOfflineProductsPage(content, pageParam, pageSize = POS_PRODUCT_PAGE_SIZE) {
  const total =
    content.length < pageSize
      ? pageParam + content.length
      : pageParam + content.length + 1;
  return {
    content,
    number: pageParam / pageSize,
    totalPages:
      content.length < pageSize
        ? pageParam / pageSize + 1
        : pageParam / pageSize + 2,
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
  catalogKind,
}) {
  const trimmedSearch = search?.trim() || '';
  const pharmacy = catalogKind === 'pharmacy';
  const pageSize = posCatalogPageSize(catalogKind);
  return withRemoteFallback(
    storeId,
    () =>
      (pharmacy
        ? pharmacyWarehouseApi.listProducts(
            {
              storeId,
              search: trimmedSearch || undefined,
              page: pageParam,
              size: pageSize,
              activeOnly: true,
              scope: 'ACTIVE',
            },
            onlineCatalogConfig(signal),
          )
        : productApi.getAll(
            {
              storeId,
              categoryId,
              search: trimmedSearch || undefined,
              page: pageParam,
              size: pageSize,
              activeOnly: true,
            },
            onlineCatalogConfig(signal),
          )
      ).then((r) => r.data),
    async () => {
      const content = await offlineSearchProducts({
        search: trimmedSearch,
        categoryId,
        limit: pageSize,
        offset: pageParam,
      });
      return buildOfflineProductsPage(content, pageParam, pageSize);
    },
  );
}

export function posProductsNextPageParam(lastPage, lastPageParam, storeId = null, catalogKind = null) {
  const useLocal = routeFor(storeId).route === 'local';
  const pageSize = posCatalogPageSize(catalogKind);
  const next = (lastPage?.number ?? 0) + 1;
  const total = lastPage?.totalPages ?? 0;
  return next < total ? (useLocal ? lastPageParam + pageSize : next) : undefined;
}

export async function posFetchProductByBarcode(storeId, barcode, { catalogKind } = {}) {
  const trimmed = String(barcode || '').trim();
  if (!trimmed) return null;
  const pharmacy = catalogKind === 'pharmacy';
  return withRemoteFallback(
    storeId,
    () =>
      (pharmacy
        ? pharmacyWarehouseApi.getByBarcode(trimmed, storeId)
        : productApi.getByBarcode(trimmed, storeId)
      ).then((r) => r.data),
    () => offlineGetProductByBarcode(trimmed),
  );
}

function shiftApi(catalogKind) {
  return catalogKind === 'pharmacy' ? pharmacyShiftApi : cashierShiftApi;
}

export async function posFetchCurrentShift(storeId, user, storeName = '', { catalogKind } = {}) {
  const { route } = routeFor(storeId);
  if (route === 'local' && user?.id) {
    const local = await offlineGetCurrentShift({ storeId, cashierId: user.id });
    return local?.status === 'OPEN' ? local : null;
  }
  const apiClient = shiftApi(catalogKind);
  try {
    const res = await apiClient.current(storeId);
    const shift = res.data;
    // Только реально открытая смена; CLOSED/прочее не держим в кэше — иначе модалка мигает «Закрыть».
    if (!shift || shift.status !== 'OPEN') {
      if (isDesktopOfflineBridge() && user?.id) {
        try {
          await offlineCloseShift({ storeId, cashierId: user.id });
        } catch {
          /* ignore */
        }
      }
      return null;
    }
    if (user?.id && isDesktopOfflineBridge()) {
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
      const local = await offlineGetCurrentShift({ storeId, cashierId: user.id });
      return local?.status === 'OPEN' ? local : null;
    }
    throw e;
  }
}

export async function posOpenShift(storeId, user, storeName = '', { catalogKind } = {}) {
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
  const apiClient = shiftApi(catalogKind);
  try {
    const identity = await resolveCashierTerminalIdentity();
    const terminal = buildTerminalRequest(identity);
    let body;
    if (catalogKind === 'pharmacy') {
      let cashRegisterId;
      let registerNumber;
      if (terminal) {
        try {
          const reg = await cashierTerminalApi.register(storeId, terminal).then((r) => r.data);
          cashRegisterId = reg?.cashRegisterId;
          registerNumber = reg?.registerNumber;
        } catch {
          /* open shift without register binding — Multikassa falls back to store register */
        }
      }
      body = {
        storeName: storeName || undefined,
        cashierName: user?.fullName || user?.username || undefined,
        ...(cashRegisterId != null ? { cashRegisterId, registerNumber } : {}),
      };
    } else {
      body = terminal ? { terminal } : null;
    }
    const res = await apiClient.open(storeId, body);
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
      // Фискальная смена уже открыта на этом компьютере — POS-смену оставляем.
      if (isFiscalShiftAlreadyOpenError(fiscalErr)) {
        return shift;
      }
      try {
        await apiClient.close(shift.id);
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
      const res = await apiClient.current(storeId);
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

export async function posCloseShift(shiftId, storeId, user, shiftHint = null, { catalogKind } = {}) {
  const { route } = routeFor(storeId);
  if (route === 'local' && user?.id) {
    await offlineCloseShift({ storeId, cashierId: user.id });
    return { id: shiftId, status: 'CLOSED' };
  }

  const apiClient = shiftApi(catalogKind);
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

  const closed = await apiClient.close(shiftId).then((r) => r.data);
  if (isDesktopOfflineBridge() && user?.id) {
    try {
      await offlineCloseShift({ storeId, cashierId: user.id });
    } catch {
      /* ignore */
    }
  }
  return closed;
}

export async function posXReport(shiftId, storeId, user, shiftHint = null, { catalogKind } = {}) {
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
  if (catalogKind === 'pharmacy') {
    // Pharmacy owns shifts; X print uses Multikassa fiscal + shift aggregates (no PosCore x-report).
    return buildShiftPrintReport(shiftHint || { storeId }, {
      reportType: 'X',
      storeName: shiftHint?.storeName || '',
      cashierName: user?.fullName || user?.username || shiftHint?.cashierName || '',
      reportAt: new Date().toISOString(),
    });
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
  catalogKind,
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
  let capabilities = { enabled: false, printFiscalQr: true };
  try {
    const cashRegisterId = cachedShift?.cashRegisterId ?? null;
    capabilities = await loadMultikassaCapabilities(storeId, cashRegisterId, {
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
      printFiscalQr: capabilities?.printFiscalQr !== false,
    });
  }

  const onlineTimeout = resolveOnlineSaleTimeoutMs();

  try {
    const pharmacyExtras = buildPharmacySaleExtras(payment);
    const salePayload = {
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
      printFiscalQr: capabilities?.printFiscalQr !== false,
    };
    const saleClient = catalogKind === 'pharmacy' ? pharmacySalesApi : saleApi;
    return await saleClient.create(
      salePayload,
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
        printFiscalQr: capabilities?.printFiscalQr !== false,
      });
    }
    throw err;
  }
}

export async function posFetchMySales(storeId, params = {}, { catalogKind } = {}) {
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
    const client = catalogKind === 'pharmacy' ? pharmacySalesApi : saleApi;
    return await client.mySales(params).then((r) => r.data);
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

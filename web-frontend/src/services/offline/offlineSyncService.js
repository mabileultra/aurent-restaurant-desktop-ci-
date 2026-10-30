import { resolveSyncApi } from '../api';
import { isCatalogStoreMismatch } from './connectivityRules';
import {
  offlineGetStatus,
  offlineImportBootstrap,
  offlineListPendingSales,
  offlineMarkSalesSynced,
  isDesktopOfflineBridge,
} from './desktopOfflineBridge';
import { pullAndApplyCatalogDelta, shouldUseCatalogDelta } from './catalogDeltaSync';
import { markApiReachable, useConnectivityStore } from '../../store/connectivityStore';
import { FISCAL_STATUS, resolvePendingFiscalProvider, toSaleFiscalPayload } from '../fiscal';
import { logCatalog, logSale } from '../desktop/activityLog';

/** Отправка очереди продаж — часто (лёгкий запрос). */
export const SALES_SYNC_INTERVAL_MS = 60_000;

/** Полный каталог: не чаще этого интервала (раньше 4ч — новые товары не попадали на десктоп). */
export const CATALOG_MAX_AGE_MS = 15 * 60 * 1000;

/** Как часто проверять, не пора ли обновить каталог (без скачивания). */
export const CATALOG_STALE_CHECK_MS = 30 * 60 * 1000;

export function isCatalogStale(lastCatalogSyncAt) {
  if (!lastCatalogSyncAt) return true;
  const ts = Date.parse(lastCatalogSyncAt);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts >= CATALOG_MAX_AGE_MS;
}

export { isCatalogStoreMismatch } from './connectivityRules';

function syncClient(catalogKind) {
  return resolveSyncApi(catalogKind);
}

export async function pullCatalogBootstrap(storeId, { catalogKind } = {}) {
  const res = await syncClient(catalogKind).bootstrap(storeId);
  const data = res.data;
  markApiReachable();
  if (isDesktopOfflineBridge()) {
    const imported = await offlineImportBootstrap(data);
    if (imported && imported.ok === false) {
      throw new Error(imported.error || 'offline_db_unavailable');
    }
  }
  logCatalog('Каталог загружен с сервера', {
    storeId,
    catalogKind,
    products: data?.products?.length ?? 0,
  });
  return data;
}

export async function refreshCatalogBootstrap(storeId, { force = false, catalogKind } = {}) {
  if (!isDesktopOfflineBridge()) return { skipped: true, reason: 'not-desktop' };

  const status = await offlineGetStatus();
  const storeMismatch = isCatalogStoreMismatch(status.storeId, storeId);

  if (!force && !storeMismatch) {
    if (!isCatalogStale(status.lastCatalogSyncAt)) {
      return {
        skipped: true,
        reason: 'fresh',
        lastCatalogSyncAt: status.lastCatalogSyncAt,
      };
    }
  }

  if (
    shouldUseCatalogDelta({
      catalogKind,
      force,
      storeMismatch,
      lastCatalogSyncAt: status.lastCatalogSyncAt,
    })
  ) {
    const delta = await pullAndApplyCatalogDelta(storeId, status.lastCatalogSyncAt, {
      catalogKind,
    });
    if (!delta.fullReset) {
      return {
        skipped: false,
        mode: 'delta',
        productCount: delta.imported?.productCount ?? status.productCount,
        upserted: delta.imported?.upserted ?? delta.data?.products?.length ?? 0,
        removed: delta.imported?.removed ?? delta.data?.removedProductIds?.length ?? 0,
        syncedAt: delta.data?.syncedAt ?? new Date().toISOString(),
      };
    }
  }

  const data = await pullCatalogBootstrap(storeId, { catalogKind });
  return {
    skipped: false,
    mode: 'bootstrap',
    productCount: data?.products?.length ?? 0,
    syncedAt: data?.syncedAt ?? new Date().toISOString(),
  };
}

export async function pushPendingSales({ catalogKind } = {}) {
  if (!isDesktopOfflineBridge()) return { pushed: 0, failed: 0, results: [] };

  const pending = await offlineListPendingSales();
  if (!pending.length) return { pushed: 0, failed: 0, results: [] };

  const status = await offlineGetStatus();
  const deviceId = status.deviceId;

  const sales = [];
  for (const row of pending) {
    let payload = row.payload || {};
    try {
      payload = await resolvePendingFiscalProvider(payload).retryPending(payload, {
        storeId: payload.storeId,
        cashRegisterId: null,
      });
    } catch {
      /* keep pending fiscal */
    }

    const fiscal = payload.fiscal
      ? toSaleFiscalPayload({
          fiscalStatus: payload.fiscal.fiscalStatus || FISCAL_STATUS.PENDING,
          fiscalSign: payload.fiscal.fiscalSign,
          fiscalReceiptSeq: payload.fiscal.fiscalReceiptSeq,
          multikassaSaleId: payload.fiscal.multikassaSaleId,
          fiscalQrUrl: payload.fiscal.fiscalQrUrl,
          fiscalError: payload.fiscal.fiscalError,
          terminalId: payload.fiscal.fiscalTerminalId || payload.fiscal.terminalId,
          fiscalTerminalId: payload.fiscal.fiscalTerminalId || payload.fiscal.terminalId,
          fiscalProvider: payload.fiscal.fiscalProvider,
          fiscalDriveTxid: payload.fiscal.fiscalDriveTxid,
          fiscalDriveRetry: payload.fiscal.fiscalDriveRetry,
        })
      : undefined;

    const sale = { ...payload, ...(fiscal ? { fiscal } : {}) };
    delete sale.multikassaRetryBody;

    sales.push({
      clientSaleId: row.clientSaleId,
      offlineDeviceId: deviceId,
      createdAt: row.createdAt,
      clientShiftId: row.clientShiftId,
      shiftOpenedAt: row.shiftOpenedAt,
      sale,
    });
  }

  const res = await syncClient(catalogKind).pushSalesBatch({ sales });
  markApiReachable();
  const results = res.data?.results || [];
  await offlineMarkSalesSynced(results);
  const ok = results.filter((r) => r.status === 'CREATED' || r.status === 'ALREADY_EXISTS').length;
  logSale('Офлайн-продажи отправлены на сервер', {
    catalogKind,
    pushed: ok,
    failed: results.length - ok,
    batch: sales.length,
  });
  return { pushed: ok, failed: results.length - ok, results };
}

/** Только продажи — для частого фонового цикла. */
export async function runSalesSyncOnly({ catalogKind } = {}) {
  try {
    return await pushPendingSales({ catalogKind });
  } catch (err) {
    useConnectivityStore.getState().setSyncResult({ ok: false, error: err?.message || String(err) });
    return { pushed: 0, failed: 0, results: [], error: err?.message || String(err) };
  }
}

/** Каталог — только если устарел или force (ручное обновление). */
export async function runCatalogSyncIfNeeded(storeId, { force = false, catalogKind } = {}) {
  try {
    return await refreshCatalogBootstrap(storeId, { force, catalogKind });
  } catch (err) {
    const error = err?.response?.data?.message || err?.message || String(err);
    return { skipped: true, reason: 'error', error };
  }
}

import { resolveSyncApi } from '../api';
import { markApiReachable } from '../../store/connectivityStore';
import { logCatalog } from '../desktop/activityLog';
import { offlineImportCatalogDelta, isDesktopOfflineBridge } from './desktopOfflineBridge';

export function shouldUseCatalogDelta({ catalogKind, force, storeMismatch, lastCatalogSyncAt }) {
  if (catalogKind === 'pharmacy') return false;
  if (force || storeMismatch) return false;
  if (!lastCatalogSyncAt) return false;
  const ts = Date.parse(lastCatalogSyncAt);
  return !Number.isNaN(ts);
}

/**
 * Pull grocery catalog delta and apply to desktop SQLite.
 * Returns `{ fullReset: true }` when the server asks for bootstrap.
 */
export async function pullAndApplyCatalogDelta(storeId, since, { catalogKind } = {}) {
  const client = resolveSyncApi(catalogKind);
  if (typeof client.catalogDelta !== 'function') {
    return { fullReset: true, reason: 'delta-unsupported' };
  }

  const res = await client.catalogDelta(storeId, since);
  const data = res.data;
  markApiReachable();

  if (data?.fullReset) {
    logCatalog('Дельта каталога: нужен полный bootstrap', { storeId, since });
    return { fullReset: true, reason: 'server-full-reset', data };
  }

  if (isDesktopOfflineBridge()) {
    const imported = await offlineImportCatalogDelta(data);
    if (imported && imported.ok === false) {
      if (imported.fullReset) {
        return { fullReset: true, reason: 'client-full-reset', imported };
      }
      throw new Error(imported.error || 'offline_db_unavailable');
    }
    logCatalog('Дельта каталога применена', {
      storeId,
      upserted: imported?.upserted ?? data?.products?.length ?? 0,
      removed: imported?.removed ?? data?.removedProductIds?.length ?? 0,
    });
    return { fullReset: false, data, imported };
  }

  return { fullReset: false, data, imported: null };
}

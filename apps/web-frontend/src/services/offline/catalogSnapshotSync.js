import { resolveSyncApi } from '../api';
import { markApiReachable } from '../../store/connectivityStore';
import { logCatalog } from '../desktop/activityLog';
import { offlineImportProductSnapshots, isDesktopOfflineBridge } from './desktopOfflineBridge';

/**
 * Pull ProductSnapshot feed (catalog-service outbox via web-backend) and apply to desktop SQLite.
 * No-op when catalog-service dual-path is disabled (`catalogEnabled=false`).
 */
export async function pullAndApplyCatalogSnapshots(since, { catalogKind, limit = 50 } = {}) {
  if (catalogKind === 'pharmacy') {
    return { skipped: true, reason: 'pharmacy' };
  }
  const client = resolveSyncApi(catalogKind);
  if (typeof client.catalogSnapshots !== 'function') {
    return { skipped: true, reason: 'unsupported' };
  }

  const res = await client.catalogSnapshots(since, limit);
  const data = res.data;
  markApiReachable();

  if (!data?.catalogEnabled) {
    return { skipped: true, reason: 'catalog-disabled', data };
  }

  const events = data?.events || [];
  if (!events.length) {
    return { skipped: false, applied: 0, data };
  }

  if (!isDesktopOfflineBridge()) {
    return { skipped: false, applied: 0, data, imported: null };
  }

  const imported = await offlineImportProductSnapshots({
    events,
    syncedAt: data?.syncedAt || new Date().toISOString(),
  });
  if (imported && imported.ok === false) {
    throw new Error(imported.error || 'offline_db_unavailable');
  }

  logCatalog('Catalog snapshots applied', {
    upserted: imported?.upserted ?? 0,
    removed: imported?.removed ?? 0,
    events: events.length,
  });
  return { skipped: false, applied: events.length, data, imported };
}

import { canRunOnlineSync } from './canRunOnlineSync';
import { offlineGetStatus } from './desktopOfflineBridge';
import { isCatalogStoreMismatch } from './connectivityRules';
import { runCatalogSyncIfNeeded, runSalesSyncOnly } from './offlineSyncService';
import { useConnectivityStore } from '../../store/connectivityStore';
import { SYNC_PHASE } from './syncPhase';
import { logCatalog, logSync } from '../desktop/activityLog';

/**
 * After API comes back: push pending sales first when local catalog is ready
 * (feels like online), then refresh catalog. Empty DB still bootstraps catalog first.
 */
export async function runDesktopReconnectSync(storeId, { catalogKind } = {}) {
  if (!storeId || !canRunOnlineSync()) {
    return { skipped: true, reason: 'offline' };
  }

  const store = useConnectivityStore.getState();
  store.setSyncing(true);
  store.setSyncPhase(SYNC_PHASE.CHECKING);
  logSync('Reconnect: проверка связи', { storeId, catalogKind });

  try {
    let forceCatalog = false;
    let bootstrapReady = false;
    try {
      const status = await offlineGetStatus();
      bootstrapReady = Boolean(
        status.bootstrapReady || status.canSellOffline || Number(status.productCount) > 0,
      );
      forceCatalog = isCatalogStoreMismatch(status.storeId, storeId) || !bootstrapReady;
    } catch {
      forceCatalog = true;
    }

    let catalogResult = null;
    let sales = null;

    if (forceCatalog) {
      store.setSyncPhase(SYNC_PHASE.CATALOG);
      store.setSyncingCatalog(true);
      logCatalog('Reconnect: загрузка каталога', { storeId, catalogKind, forceCatalog: true });
      catalogResult = await runCatalogSyncIfNeeded(storeId, {
        force: true,
        catalogKind,
      });
      if (catalogResult?.skipped && catalogResult?.reason === 'error') {
        store.setSyncResult({
          ok: false,
          error: catalogResult.error || 'catalog_sync_failed',
        });
        logCatalog(`Reconnect: ошибка каталога — ${catalogResult.error || 'error'}`, { storeId }, 'error');
        return { skipped: false, catalog: catalogResult, sales: null };
      }
      store.setSyncingCatalog(false);

      store.setSyncPhase(SYNC_PHASE.SALES);
      logSync('Reconnect: отправка офлайн-продаж', { storeId });
      sales = await runSalesSyncOnly({ catalogKind });
    } else {
      // Online-feel path: clear sale queue first, catalog refresh is secondary.
      store.setSyncPhase(SYNC_PHASE.SALES);
      logSync('Reconnect: отправка офлайн-продаж', { storeId });
      sales = await runSalesSyncOnly({ catalogKind });

      store.setSyncPhase(SYNC_PHASE.CATALOG);
      logCatalog('Reconnect: проверка каталога', { storeId, catalogKind, forceCatalog: false });
      catalogResult = await runCatalogSyncIfNeeded(storeId, {
        force: false,
        catalogKind,
      });
      if (catalogResult?.skipped && catalogResult?.reason === 'error') {
        store.setSyncResult({
          ok: false,
          error: catalogResult.error || 'catalog_sync_failed',
        });
        logCatalog(`Reconnect: ошибка каталога — ${catalogResult.error || 'error'}`, { storeId }, 'error');
        return { skipped: false, catalog: catalogResult, sales };
      }
    }

    const salesFailed = Number(sales?.failed || 0);
    if (sales?.error || salesFailed > 0) {
      store.setSyncResult({
        ok: false,
        error: sales?.error || `sales_failed:${salesFailed}`,
      });
      logSync(
        `Reconnect: продажи с ошибками (pushed=${sales?.pushed || 0}, failed=${salesFailed})`,
        { storeId },
        'warn',
      );
      return { skipped: false, catalog: catalogResult, sales };
    }

    store.setSyncResult({ ok: true });
    logSync('Reconnect: синхронизация завершена', {
      storeId,
      catalogSkipped: Boolean(catalogResult?.skipped),
      pushed: sales?.pushed || 0,
    });
    return { skipped: false, catalog: catalogResult, sales };
  } catch (err) {
    useConnectivityStore.getState().setSyncResult({
      ok: false,
      error: err?.message || String(err),
    });
    logSync(`Reconnect: сбой — ${err?.message || err}`, { storeId }, 'error');
    return { skipped: false, error: err?.message || String(err) };
  } finally {
    useConnectivityStore.getState().setSyncing(false);
    useConnectivityStore.getState().setSyncingCatalog(false);
  }
}

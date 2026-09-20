import { canRunOnlineSync } from './canRunOnlineSync';
import { offlineGetStatus } from './desktopOfflineBridge';
import { isCatalogStoreMismatch } from './connectivityRules';
import { runCatalogSyncIfNeeded, runSalesSyncOnly } from './offlineSyncService';
import { useConnectivityStore } from '../../store/connectivityStore';
import { SYNC_PHASE } from './syncPhase';
import { logCatalog, logSync } from '../desktop/activityLog';

/**
 * After API comes back: refresh catalog if needed, then push pending sales.
 * Updates syncPhase so the cashier UI can show progress.
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
    try {
      const status = await offlineGetStatus();
      forceCatalog =
        isCatalogStoreMismatch(status.storeId, storeId)
        || !(status.bootstrapReady || status.canSellOffline || Number(status.productCount) > 0);
    } catch {
      forceCatalog = true;
    }

    store.setSyncPhase(SYNC_PHASE.CATALOG);
    if (forceCatalog) {
      store.setSyncingCatalog(true);
    }
    logCatalog(
      forceCatalog ? 'Reconnect: загрузка каталога' : 'Reconnect: проверка каталога',
      { storeId, catalogKind, forceCatalog },
    );

    const catalogResult = await runCatalogSyncIfNeeded(storeId, {
      force: forceCatalog,
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

    store.setSyncPhase(SYNC_PHASE.SALES);
    store.setSyncingCatalog(false);
    logSync('Reconnect: отправка офлайн-продаж', { storeId });

    const sales = await runSalesSyncOnly({ catalogKind });
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

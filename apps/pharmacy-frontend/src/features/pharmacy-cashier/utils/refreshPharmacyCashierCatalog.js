import { refreshCatalogBootstrap } from '../../../services/offline/offlineSyncService';
import { isDesktopOfflineBridge } from '../../../services/offline/desktopOfflineBridge';

/**
 * После инвентаризации/прихода касса должна увидеть новый остаток.
 * Online: invalidate React Query → API store_stock.
 * Desktop + syncDesktop: force bootstrap SQLite (кнопка «Обновить» / сигнал склада).
 * Авто-тикер без syncDesktop только инвалидирует кэш — иначе полный bootstrap каждую минуту.
 *
 * @param {import('@tanstack/react-query').QueryClient} qc
 * @param {number|string|null|undefined} storeId
 * @param {{ syncDesktop?: boolean }} [opts]
 */
export async function refreshPharmacyCashierCatalog(qc, storeId, { syncDesktop = false } = {}) {
  if (!qc) return;
  qc.invalidateQueries({ queryKey: ['pos-products'] });
  qc.invalidateQueries({ queryKey: ['pharmacy-fefo-hints'] });
  qc.invalidateQueries({ queryKey: ['pharmacy-lots'] });
  if (
    !syncDesktop
    || !isDesktopOfflineBridge()
    || storeId == null
    || storeId === ''
  ) {
    return;
  }
  try {
    await refreshCatalogBootstrap(storeId, {
      force: true,
      catalogKind: 'pharmacy',
    });
    qc.invalidateQueries({ queryKey: ['pos-products'] });
  } catch {
    /* сеть/офлайн — список уже инвалидирован */
  }
}

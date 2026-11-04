import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useConnectivityStore } from '../../../store/connectivityStore';
import { isDesktopOfflineBridge } from '../../../services/offline/desktopOfflineBridge';
import { SYNC_PHASE, SYNC_PHASE_I18N, isActiveSyncPhase } from '../../../services/offline/syncPhase';
import '../../../styles/cashier/shell/offline-sync-progress.css';

const DONE_HIDE_MS = 3_500;

/**
 * Full-width progress strip: checking → catalog → sales → done/error.
 */
export default function OfflineSyncProgressBanner() {
  const { t } = useTranslation();
  const syncPhase = useConnectivityStore((s) => s.syncPhase);
  const syncPhaseDetail = useConnectivityStore((s) => s.syncPhaseDetail);
  const pendingSales = useConnectivityStore((s) => s.pendingSales);
  const productCount = useConnectivityStore((s) => s.productCount);

  useEffect(() => {
    if (syncPhase !== SYNC_PHASE.DONE && syncPhase !== SYNC_PHASE.ERROR) return undefined;
    const timer = window.setTimeout(() => {
      useConnectivityStore.getState().setSyncPhase(SYNC_PHASE.IDLE);
    }, DONE_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [syncPhase]);

  if (!isDesktopOfflineBridge()) return null;
  if (syncPhase === SYNC_PHASE.IDLE) return null;

  const active = isActiveSyncPhase(syncPhase);
  const labelKey = SYNC_PHASE_I18N[syncPhase] || 'offline.syncing';
  let detail = '';
  if (syncPhase === SYNC_PHASE.SALES && pendingSales > 0) {
    detail = t('offline.phaseSalesDetail', { count: pendingSales });
  } else if (syncPhase === SYNC_PHASE.CATALOG && productCount > 0) {
    detail = t('offline.phaseCatalogDetail', { count: productCount });
  } else if (syncPhase === SYNC_PHASE.ERROR && syncPhaseDetail) {
    detail = syncPhaseDetail;
  } else if (syncPhase === SYNC_PHASE.DONE) {
    detail = t('offline.phaseDoneDetail');
  }

  const Icon = syncPhase === SYNC_PHASE.DONE
    ? CheckCircle2
    : syncPhase === SYNC_PHASE.ERROR
      ? AlertCircle
      : Loader2;

  return (
    <div
      className={`offline-sync-progress offline-sync-progress--${syncPhase}`}
      role="status"
      aria-live="polite"
      aria-busy={active}
    >
      <span className="offline-sync-progress__icon" aria-hidden>
        <Icon
          size={16}
          strokeWidth={2.25}
          className={active ? 'offline-sync-progress__spin' : undefined}
        />
      </span>
      <span className="offline-sync-progress__text">
        <span className="offline-sync-progress__title">{t(labelKey)}</span>
        {detail ? <span className="offline-sync-progress__detail">{detail}</span> : null}
      </span>
      <span className="offline-sync-progress__steps" aria-hidden>
        <span className={syncPhase === SYNC_PHASE.CHECKING || active || syncPhase === SYNC_PHASE.DONE || syncPhase === SYNC_PHASE.CATALOG || syncPhase === SYNC_PHASE.SALES ? 'is-on' : ''}>1</span>
        <span className={syncPhase === SYNC_PHASE.CATALOG || syncPhase === SYNC_PHASE.SALES || syncPhase === SYNC_PHASE.DONE ? 'is-on' : ''}>2</span>
        <span className={syncPhase === SYNC_PHASE.SALES || syncPhase === SYNC_PHASE.DONE ? 'is-on' : ''}>3</span>
      </span>
    </div>
  );
}

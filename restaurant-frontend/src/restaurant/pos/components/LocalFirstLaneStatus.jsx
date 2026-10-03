import { useEffect, useState } from 'react';
import {
  isRestaurantLocalFirstOn,
  rstOfflineGetStatus,
} from '../../../services/offline/restaurantOfflineBridge';
import { deriveLocalFirstLaneStatus } from '../utils/deriveLocalFirstLaneStatus';
import './local-first-lane-status.css';

const POLL_MS = 5_000;

function kitchenLabel(t, kitchen) {
  switch (kitchen) {
    case 'print_failed':
      return t('rst.order.laneKitchenFailed', { defaultValue: 'Не напечатан' });
    case 'print_unknown':
      return t('rst.order.laneKitchenUnknown', { defaultValue: 'Печать не подтверждена' });
    case 'print_pending':
      return t('rst.order.laneKitchenPending', { defaultValue: 'В очереди печати' });
    case 'printed':
      return t('rst.order.laneKitchenPrinted', { defaultValue: 'Напечатан / в очереди' });
    case 'saved':
      return t('rst.order.laneKitchenSaved', { defaultValue: 'Сохранён локально' });
    default:
      return t('rst.order.laneKitchenIdle', { defaultValue: '—' });
  }
}

function syncLabel(t, sync) {
  switch (sync) {
    case 'waiting':
      return t('rst.order.laneSyncWaiting', { defaultValue: 'Ожидает подключения' });
    case 'synced':
      return t('rst.order.laneSyncOk', { defaultValue: 'Синхронизирован' });
    default:
      return t('rst.order.laneSyncIdle', { defaultValue: '—' });
  }
}

function mark(ok) {
  if (ok === true) return '✓';
  if (ok === false) return '⚠';
  return '·';
}

/**
 * Local-first warning strip — only when print/sync needs attention.
 * Hub URL lives in waiter profile / admin, not on every order.
 */
export default function LocalFirstLaneStatus({ order, t }) {
  const localFirst = isRestaurantLocalFirstOn();
  const [queues, setQueues] = useState(null);

  useEffect(() => {
    if (!localFirst) return undefined;
    let cancelled = false;
    const tick = async () => {
      try {
        const status = await rstOfflineGetStatus();
        if (cancelled) return;
        setQueues({
          pendingPrintJobs: status?.pendingPrintJobs ?? 0,
          unknownPrintJobs: status?.unknownPrintJobs ?? 0,
          failedPrintJobs: status?.failedPrintJobs ?? 0,
          pendingOutbox: status?.pendingOutbox ?? 0,
        });
      } catch {
        if (!cancelled) setQueues(null);
      }
    };
    void tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [localFirst, order?.id]);

  if (!localFirst) return null;

  const lanes = deriveLocalFirstLaneStatus({ order, queues, localFirst: true });
  if (!lanes?.visible) return null;

  const kitchenOk = lanes.kitchen === 'printed' || lanes.kitchen === 'print_pending';
  const kitchenBad = lanes.kitchen === 'print_failed' || lanes.kitchen === 'print_unknown';
  const syncOk = lanes.sync === 'synced';
  const syncBad = lanes.sync === 'waiting';

  return (
    <div className="rst-local-lanes" role="status">
      {lanes.kitchen !== 'idle' ? (
        <div className={`rst-local-lanes__row${kitchenBad ? ' is-warn' : ''}${kitchenOk ? ' is-ok' : ''}`}>
          <span className="rst-local-lanes__mark">{mark(kitchenBad ? false : kitchenOk ? true : null)}</span>
          <span className="rst-local-lanes__label">{t('rst.order.laneKitchen', { defaultValue: 'Кухня' })}</span>
          <span className="rst-local-lanes__value">{kitchenLabel(t, lanes.kitchen)}</span>
        </div>
      ) : null}
      {lanes.sync === 'waiting' ? (
        <div className={`rst-local-lanes__row${syncBad ? ' is-warn' : ''}${syncOk ? ' is-ok' : ''}`}>
          <span className="rst-local-lanes__mark">{mark(syncBad ? false : syncOk ? true : null)}</span>
          <span className="rst-local-lanes__label">{t('rst.order.laneSync', { defaultValue: 'Синк' })}</span>
          <span className="rst-local-lanes__value">{syncLabel(t, lanes.sync)}</span>
        </div>
      ) : null}
    </div>
  );
}

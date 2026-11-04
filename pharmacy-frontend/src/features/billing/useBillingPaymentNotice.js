import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BILLING_NOTICE_DURATION_MS,
  localPartsInZone,
  markHoursShown,
  msUntilNextSlot,
  pendingCatchUpSlots,
  readShownHours,
} from './billingNoticeSchedule';

/**
 * Показывает мягкое напоминание об оплате: catch-up при входе + слоты 10/15/21.
 * При просыпании вкладки догоняет пропущенные слоты (не теряет из‑за throttling таймеров).
 * @param {{ enabled: boolean, companyId: number|string|null|undefined, noticeRequired: boolean }} opts
 */
export function useBillingPaymentNotice({ enabled, companyId, noticeRequired }) {
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef(null);
  const scheduleTimerRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (scheduleTimerRef.current) {
      clearTimeout(scheduleTimerRef.current);
      scheduleTimerRef.current = null;
    }
  }, []);

  const showNotice = useCallback((hoursToMark) => {
    if (!companyId || !hoursToMark?.length) return;
    const { dayKey } = localPartsInZone();
    markHoursShown(companyId, dayKey, hoursToMark);
    setVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      hideTimerRef.current = null;
    }, BILLING_NOTICE_DURATION_MS);
  }, [companyId]);

  const showPendingIfAny = useCallback(() => {
    if (!companyId) return false;
    const { dayKey } = localPartsInZone();
    const shown = readShownHours(companyId, dayKey);
    const { hours } = pendingCatchUpSlots(shown);
    if (hours.length === 0) return false;
    showNotice(hours);
    return true;
  }, [companyId, showNotice]);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimers();
    setVisible(false);
    if (!enabled || !noticeRequired || companyId == null) {
      return undefined;
    }

    showPendingIfAny();

    const armNext = () => {
      if (scheduleTimerRef.current) {
        clearTimeout(scheduleTimerRef.current);
        scheduleTimerRef.current = null;
      }
      const delay = msUntilNextSlot();
      scheduleTimerRef.current = setTimeout(() => {
        scheduleTimerRef.current = null;
        showPendingIfAny();
        armNext();
      }, Math.max(delay, 1000));
    };
    armNext();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        showPendingIfAny();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearTimers();
    };
  }, [enabled, noticeRequired, companyId, showPendingIfAny, clearTimers]);

  return { visible, dismiss };
}

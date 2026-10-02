import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  mapDesktopUpdateEvent,
  mergeDesktopUpdateState,
} from '../../../../services/desktop/desktopUpdateNotifications';

function isDesktop() {
  return typeof window !== 'undefined' && window.desktopCashier?.isDesktop === true;
}

/**
 * Desktop auto-update state for restaurant cashier menu.
 */
export function useRestaurantDesktopUpdate(t) {
  const [update, setUpdate] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isDesktop() || typeof window.desktopCashier?.onDesktopUpdate !== 'function') {
      return undefined;
    }
    return window.desktopCashier.onDesktopUpdate((event) => {
      const mapped = mapDesktopUpdateEvent(event);
      setUpdate((prev) => mergeDesktopUpdateState(prev, mapped));
    });
  }, []);

  useEffect(() => {
    if (!isDesktop() || typeof window.desktopCashier?.checkForUpdates !== 'function') {
      return undefined;
    }
    // Catch already-downloaded / pending feed after UI load.
    const timer = window.setTimeout(() => {
      window.desktopCashier.checkForUpdates().catch(() => {});
    }, 3_000);
    return () => window.clearTimeout(timer);
  }, []);

  const checkAppUpdates = useCallback(async () => {
    if (!isDesktop() || typeof window.desktopCashier?.checkForUpdates !== 'function') {
      return;
    }
    setChecking(true);
    try {
      const result = await window.desktopCashier.checkForUpdates();
      if (result?.updateAvailable) {
        toast.success(
          t('rst.cashier.checkUpdatesAvailable', { version: result.version || '' }),
        );
      } else if (result?.ok && result?.reason !== 'signature') {
        toast.success(t('rst.cashier.checkUpdatesLatest'));
      } else if (result?.reason !== 'dev' && result?.reason !== 'signature') {
        toast.error(t('rst.cashier.checkUpdatesFailed'));
      }
    } catch {
      toast.error(t('rst.cashier.checkUpdatesFailed'));
    } finally {
      setChecking(false);
    }
  }, [t]);

  const runUpdateAction = useCallback(async () => {
    if (!update) return;
    if (update.updateState === 'downloaded') {
      if (typeof window.desktopCashier?.quitAndInstallUpdate === 'function') {
        await window.desktopCashier.quitAndInstallUpdate();
      }
      return;
    }
    if (update.updateState === 'error') {
      await checkAppUpdates();
    }
  }, [update, checkAppUpdates]);

  const hasBadge = Boolean(
    update
    && (update.updateState === 'downloaded'
      || update.updateState === 'available'
      || update.updateState === 'progress'
      || update.updateState === 'error'),
  );

  const badgeUrgent = update?.updateState === 'downloaded' || update?.updateState === 'error';

  return {
    isDesktop: isDesktop(),
    update,
    checking,
    hasBadge,
    badgeUrgent,
    checkAppUpdates,
    runUpdateAction,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cashierDesktopNotificationsApi } from '../../../api/cashier/desktopNotifications.api';
import { isDesktopCashier } from '../utils/isDesktopCashier';
import {
  mapDesktopUpdateEvent,
  mergeDesktopUpdateItem,
} from '../utils/desktopUpdateNotifications';
import { useShouldUseOfflinePos } from '../../../store/connectivityStore';

const LOCAL_READ_KEY = 'cashier-desktop-local-notifications-read';

function loadLocalReadSet() {
  try {
    const raw = localStorage.getItem(LOCAL_READ_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveLocalReadSet(set) {
  localStorage.setItem(LOCAL_READ_KEY, JSON.stringify([...set]));
}

function mapServerItem(item) {
  return {
    id: `server-${item.id}`,
    source: 'server',
    serverId: item.id,
    title: item.title,
    body: item.body,
    kind: item.kind,
    actionLabel: item.actionLabel,
    actionUrl: item.actionUrl,
    createdAt: item.createdAt,
    read: Boolean(item.read),
  };
}

export function useCashierNotifications() {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const skipOnline = useShouldUseOfflinePos();
  const [open, setOpen] = useState(false);
  const [serverItems, setServerItems] = useState([]);
  const [updateItems, setUpdateItems] = useState([]);
  const [localRead, setLocalRead] = useState(() => loadLocalReadSet());
  const [loading, setLoading] = useState(false);

  const fetchServer = useCallback(async () => {
    if (skipOnline) return;
    try {
      setLoading(true);
      const { data } = await cashierDesktopNotificationsApi.unread();
      setServerItems((data?.items || []).map(mapServerItem));
    } catch (err) {
      // Keep previous items; log so auth/deploy issues are visible in console.
      console.warn('[cashier-notifications] unread failed', err?.response?.status || err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [skipOnline]);

  useEffect(() => {
    if (skipOnline) return undefined;
    fetchServer();
    const timer = window.setInterval(fetchServer, 60_000);
    return () => window.clearInterval(timer);
  }, [fetchServer, skipOnline]);

  useEffect(() => {
    if (!isDesktopCashier() || typeof window.desktopCashier?.onDesktopUpdate !== 'function') {
      return undefined;
    }
    return window.desktopCashier.onDesktopUpdate((event) => {
      const mapped = mapDesktopUpdateEvent(event);
      if (!mapped || mapped.skip) return;
      setUpdateItems((prev) => mergeDesktopUpdateItem(prev, mapped));
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    fetchServer();
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, fetchServer]);

  const items = useMemo(() => {
    const merged = [
      ...updateItems.filter((item) => !localRead.has(item.id)),
      ...serverItems.filter((item) => !item.read),
    ];
    return merged.sort((a, b) => {
      const kindScore = (k) => (k === 'ALERT' ? 2 : k === 'UPDATE' ? 1 : 0);
      const byKind = kindScore(b.kind) - kindScore(a.kind);
      if (byKind !== 0) return byKind;
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
  }, [serverItems, updateItems, localRead]);

  const markLocalRead = useCallback((id) => {
    setLocalRead((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveLocalReadSet(next);
      return next;
    });
  }, []);

  const dismiss = useCallback(async (item) => {
    if (item.source === 'server' && item.serverId) {
      try {
        await cashierDesktopNotificationsApi.markRead(item.serverId);
        setServerItems((prev) => prev.filter((row) => row.serverId !== item.serverId));
      } catch (err) {
        console.warn('[cashier-notifications] markRead failed', err?.response?.status || err?.message || err);
      }
      return;
    }
    if (item.source === 'update') {
      setUpdateItems((prev) => prev.filter((row) => row.id !== item.id));
      return;
    }
    markLocalRead(item.id);
  }, [markLocalRead]);

  const runAction = useCallback(async (item) => {
    if (item.updateState === 'downloaded' && typeof window.desktopCashier?.quitAndInstallUpdate === 'function') {
      try {
        const res = await window.desktopCashier.quitAndInstallUpdate();
        if (res === false || res?.ok === false) {
          console.warn('[cashier-notifications] quitAndInstall refused', res);
        }
      } catch (err) {
        console.warn('[cashier-notifications] quitAndInstall failed', err?.message || err);
      }
      return;
    }
    if (item.updateState === 'error' && typeof window.desktopCashier?.checkForUpdates === 'function') {
      await window.desktopCashier.checkForUpdates();
      return;
    }
    if (item.actionUrl) {
      window.open(item.actionUrl, '_blank', 'noopener,noreferrer');
    }
    await dismiss(item);
  }, [dismiss]);

  const resolveTitle = (item) => {
    if (item.titleKey) return t(item.titleKey, item.titleParams);
    return item.title;
  };

  const resolveBody = (item) => {
    if (item.bodyKey) return t(item.bodyKey, item.bodyParams);
    return item.body;
  };

  const resolveAction = (item) => {
    if (item.actionKey) return t(item.actionKey);
    if (item.actionLabel) return item.actionLabel;
    if (item.updateState === 'downloaded') return t('notifications.restartNow');
    if (item.updateState === 'error') return t('notifications.retryUpdate');
    return null;
  };

  return {
    t,
    rootRef,
    open,
    setOpen,
    items,
    unreadCount: items.length,
    loading,
    dismiss,
    runAction,
    resolveTitle,
    resolveBody,
    resolveAction,
    refresh: fetchServer,
  };
}

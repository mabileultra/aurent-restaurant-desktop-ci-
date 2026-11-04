import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isRestaurantDesktop } from '../../../utils/restaurantDesktop';

function normalizeItem(raw) {
  if (!raw?.id) return null;
  return {
    id: String(raw.id),
    title: raw.title || '',
    body: raw.body || '',
    kind: String(raw.kind || 'MESSAGE').toUpperCase(),
    actionLabel: raw.actionLabel || null,
    actionUrl: raw.actionUrl || null,
    createdAt: raw.createdAt || null,
  };
}

/**
 * Super-admin broadcasts on restaurant-desktop (cloud poll via Electron).
 * Shows one modal at a time; OK → mark read + close. UPDATE → checkForUpdates.
 */
export function useRestaurantDesktopNotifications() {
  const [items, setItems] = useState([]);
  const updateTriggered = useRef(new Set());

  const refresh = useCallback(async () => {
    if (!isRestaurantDesktop()) return;
    const api = window.aurentRestaurant;
    if (typeof api?.fetchDesktopNotifications !== 'function') return;
    try {
      const res = await api.fetchDesktopNotifications();
      const mapped = (res?.items || []).map(normalizeItem).filter(Boolean);
      setItems(mapped);
    } catch {
      /* next poll */
    }
  }, []);

  useEffect(() => {
    if (!isRestaurantDesktop()) return undefined;
    const api = window.aurentRestaurant;
    refresh();
    const off = typeof api?.onDesktopNotifications === 'function'
      ? api.onDesktopNotifications((payload) => {
        const mapped = (payload?.items || []).map(normalizeItem).filter(Boolean);
        setItems(mapped);
      })
      : null;
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      window.clearInterval(timer);
      if (typeof off === 'function') off();
    };
  }, [refresh]);

  const active = useMemo(() => {
    if (!items.length) return null;
    const rank = (k) => (k === 'ALERT' ? 2 : k === 'UPDATE' ? 1 : 0);
    return [...items].sort((a, b) => {
      const byKind = rank(b.kind) - rank(a.kind);
      if (byKind !== 0) return byKind;
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    })[0];
  }, [items]);

  useEffect(() => {
    if (!active || active.kind !== 'UPDATE') return;
    if (updateTriggered.current.has(active.id)) return;
    updateTriggered.current.add(active.id);
    if (typeof window.desktopCashier?.checkForUpdates === 'function') {
      void window.desktopCashier.checkForUpdates();
    }
  }, [active]);

  const dismissActive = useCallback(async () => {
    if (!active) return;
    const id = active.id;
    try {
      if (typeof window.aurentRestaurant?.markDesktopNotificationRead === 'function') {
        await window.aurentRestaurant.markDesktopNotificationRead(id);
      }
    } catch {
      /* still close locally */
    }
    setItems((prev) => prev.filter((row) => row.id !== id));
  }, [active]);

  return { active, dismissActive, refresh };
}

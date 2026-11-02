import { useEffect, useState } from 'react';
import { isRestaurantDesktop, getRestaurantDesktopStatus } from '../../../utils/restaurantDesktop';

/**
 * Cloud uplink from Electron reconcile probe (not browser navigator.onLine).
 */
export function useRestaurantDesktopCloudOnline() {
  const [online, setOnline] = useState(false);
  const [liveSession, setLiveSession] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isRestaurantDesktop()) return undefined;
    let cancelled = false;

    void getRestaurantDesktopStatus().then((status) => {
      if (cancelled || !status) return;
      setOnline(Boolean(status.online));
      setLiveSession(Boolean(status.liveSession));
      setReady(true);
    });

    if (typeof window.aurentRestaurant?.onStatus !== 'function') {
      setReady(true);
      return undefined;
    }

    const unsub = window.aurentRestaurant.onStatus((status) => {
      if (cancelled || !status) return;
      if (typeof status.online === 'boolean') setOnline(Boolean(status.online));
      if (typeof status.liveSession === 'boolean') setLiveSession(Boolean(status.liveSession));
      setReady(true);
    });
    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  return { online, liveSession, ready, isDesktop: isRestaurantDesktop() };
}

import { useEffect, useState } from 'react';
import { configureDesktopApiBaseUrl } from '../../services/desktopApiInit';
import { isDesktopCashier } from '../../utils/authLogin';
import { isDesktopOfflineBridge } from '../../services/offline/desktopOfflineBridge';
import { startConnectivityWatcher } from '../../store/connectivityStore';
import AppBootPlaceholder from './AppBootPlaceholder';

export default function DesktopApiBootstrap({ children }) {
  const [ready, setReady] = useState(!isDesktopCashier());

  useEffect(() => {
    if (!isDesktopCashier()) return undefined;
    let cancelled = false;
    configureDesktopApiBaseUrl().finally(() => {
      if (!cancelled) {
        if (isDesktopOfflineBridge()) {
          startConnectivityWatcher();
        }
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <AppBootPlaceholder />;
  }

  return children;
}

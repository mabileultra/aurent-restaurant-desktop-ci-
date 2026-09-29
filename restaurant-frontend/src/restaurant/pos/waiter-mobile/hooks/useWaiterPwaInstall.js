import { useCallback, useEffect, useState } from 'react';

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return Boolean(window.navigator.standalone);
}

/**
 * Chrome/Android install prompt for waiter phone shell.
 * iOS has no beforeinstallprompt — UI shows manual hint instead.
 */
export function useWaiterPwaInstall({ enabled }) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(() => isStandaloneDisplay());

  useEffect(() => {
    if (!enabled) return undefined;

    const onPrompt = (event) => {
      event.preventDefault();
      setDeferred(event);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [enabled]);

  const canPrompt = Boolean(deferred) && !installed;

  const install = useCallback(async () => {
    if (!deferred) return false;
    deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice?.outcome === 'accepted') {
      setInstalled(true);
      return true;
    }
    return false;
  }, [deferred]);

  return {
    installed,
    canPrompt,
    /** True when native prompt unavailable (e.g. iOS Safari) but not yet standalone. */
    showManualHint: enabled && !installed && !canPrompt,
    install,
  };
}

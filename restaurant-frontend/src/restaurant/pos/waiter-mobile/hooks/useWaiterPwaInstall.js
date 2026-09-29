import { useCallback, useEffect, useMemo, useState } from 'react';

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return Boolean(window.navigator.standalone);
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Chrome/Firefox/Edge on iOS — Add to Home Screen only works in Safari. */
function isIosNonSafari() {
  if (!isIosDevice()) return false;
  const ua = navigator.userAgent || '';
  return /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|DuckDuckGo/i.test(ua);
}

function detectInstallPlatform() {
  if (typeof navigator === 'undefined') return 'other';
  if (isIosDevice()) return 'ios';
  if (/Android/i.test(navigator.userAgent || '')) return 'android';
  return 'other';
}

/**
 * Chrome/Android install prompt for waiter phone shell.
 * iOS has no beforeinstallprompt — only Safari → Share → Add to Home Screen.
 */
export function useWaiterPwaInstall({ enabled }) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(() => isStandaloneDisplay());
  const platform = useMemo(() => detectInstallPlatform(), []);
  const iosNeedsSafari = useMemo(() => isIosNonSafari(), []);

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
    enabled: Boolean(enabled),
    installed,
    canPrompt,
    platform,
    iosNeedsSafari,
    showManualHint: enabled && !installed,
    install,
  };
}

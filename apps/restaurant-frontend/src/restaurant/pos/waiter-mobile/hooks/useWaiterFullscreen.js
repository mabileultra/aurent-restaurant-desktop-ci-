import { useCallback, useEffect, useState } from 'react';
import {
  enterDocumentFullscreen,
  exitDocumentFullscreen,
  isDocumentFullscreen,
  isFullscreenSupported,
  subscribeDocumentFullscreen,
} from '../utils/documentFullscreen';
import {
  readWaiterMobilePrefs,
  writeWaiterMobilePrefs,
} from '../utils/waiterMobilePrefs';

/**
 * Preference + Fullscreen API sync for the waiter mobile shell.
 * Unsupported browsers keep the preference; apply is a no-op.
 */
export function useWaiterFullscreen({ enabled }) {
  const [preferred, setPreferred] = useState(() => readWaiterMobilePrefs().fullscreen);
  const [active, setActive] = useState(() => isDocumentFullscreen());
  const supported = isFullscreenSupported();

  useEffect(() => {
    return subscribeDocumentFullscreen(setActive);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    const apply = async () => {
      if (!preferred) {
        if (isDocumentFullscreen()) await exitDocumentFullscreen();
        return;
      }
      if (!supported || isDocumentFullscreen()) return;
      if (cancelled) return;
      await enterDocumentFullscreen();
    };

    void apply();
    return () => {
      cancelled = true;
    };
  }, [enabled, preferred, supported]);

  const setFullscreenPreferred = useCallback(async (next) => {
    const value = Boolean(next);
    writeWaiterMobilePrefs({ fullscreen: value });
    setPreferred(value);
    if (!enabled) return;
    if (value) {
      if (supported) await enterDocumentFullscreen();
    } else {
      await exitDocumentFullscreen();
    }
  }, [enabled, supported]);

  return {
    preferred,
    active,
    supported,
    setFullscreenPreferred,
  };
}

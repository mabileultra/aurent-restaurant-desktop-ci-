import { useCallback, useEffect, useState } from 'react';

function isFullscreen() {
  return Boolean(document.fullscreenElement);
}

async function enterFullscreen(el) {
  if (!el || isFullscreen()) return;
  try {
    await el.requestFullscreen?.();
  } catch {
    /* browser may block without gesture; Electron guest can still be maximized */
  }
}

async function exitFullscreen() {
  if (!isFullscreen()) return;
  try {
    await document.exitFullscreen?.();
  } catch {
    /* ignore */
  }
}

/**
 * Guest display: take the whole screen on open; F11 toggles, Esc exits.
 */
export function useCustomerDisplayFullscreen(enabled) {
  const [fullscreen, setFullscreen] = useState(() => isFullscreen());

  const toggle = useCallback(() => {
    if (isFullscreen()) exitFullscreen();
    else enterFullscreen(document.documentElement);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const onChange = () => setFullscreen(isFullscreen());
    document.addEventListener('fullscreenchange', onChange);

    const kick = window.setTimeout(() => {
      enterFullscreen(document.documentElement);
    }, 120);

    const onKey = (event) => {
      if (event.key === 'F11') {
        event.preventDefault();
        toggle();
        return;
      }
      if (event.key === 'Escape' && isFullscreen()) {
        event.preventDefault();
        exitFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(kick);
      document.removeEventListener('fullscreenchange', onChange);
      window.removeEventListener('keydown', onKey);
    };
  }, [enabled, toggle]);

  return { fullscreen, toggle };
}

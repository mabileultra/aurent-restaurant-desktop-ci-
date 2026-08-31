import { useEffect, useState } from 'react';
import { VIEWPORT_BP, VIEWPORT_MEDIA } from '../utils/viewportBreakpoints';

export const CASHIER_POS_DESKTOP_MIN_WIDTH = VIEWPORT_BP.DESKTOP;
export const CASHIER_POS_DESKTOP_MEDIA = VIEWPORT_MEDIA.posDesktop;

function readPosDesktopLayout() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(CASHIER_POS_DESKTOP_MEDIA).matches;
}

/**
 * true на экранах ≥1024px — включает POS desktop режим и крупные touch-таргеты.
 */
export function useCashierPosDesktopLayout() {
  const [posDesktop, setPosDesktop] = useState(readPosDesktopLayout);

  useEffect(() => {
    const mq = window.matchMedia(CASHIER_POS_DESKTOP_MEDIA);
    const sync = () => setPosDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return posDesktop;
}
